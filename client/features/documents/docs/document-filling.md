# Document filling

How the Documentos module (`/documents`) works now: template registry, chat extraction, the editable form panel and browser-side `.docx` rendering. For developers adding templates or extending the flow.

## What this is

The user picks a template, describes the property in a chat, and downloads the original `.docx` with the blanks filled in. The LLM only extracts values into a JSON object through the `fill_fields` tool; `docxtemplater` writes them into the template in the browser.

Invariants:

- The LLM never produces document content. Anything outside a `{{tag}}` in the `.docx` is copied byte-for-byte.
- The template's `.schema.json` is the single source of truth for field names, types and requiredness — for the tool input, the panel, and pre-render validation.
- Form state lives only in the `useDocumentFilling` hook (`hooks/use-document-filling.ts`) and is never saved; reloading or switching templates discards it. The conversation is saved per template when chat history is available (`client/docs/chat-history.md`), and reopening it refills only the fields the tool extracted.

## Surface

### Files under `client/public/templates/`

| Path                         | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `index.json`                 | Array of `TemplateEntry`; populates the picker and the selector          |
| `<group>/<name>.docx`        | Original template with `{{tags}}` (`cbmsc/` for fire-department annexes) |
| `<group>/<name>.schema.json` | Field definitions (`TemplateSchema`)                                     |
| `proposal/`                  | Reserved for the commercial proposal; empty                              |

### HTTP

| Method | Path                  | Caller           | Returns                                                                                                                                                                                                                                                                          |
| ------ | --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/documents/chat` | `Chat` component | AI SDK UI message stream (SSE). `500` with a Portuguese "Nenhum modelo de IA configurado…" message when no model is configured on `/admin` (see `client/docs/llm-configuration.md`); `400`/`413`/`429` from the request checks and quota in `client/docs/chat-request-limits.md` |

Requires a signed-in, approved user (`client/docs/authentication.md`); without Supabase it answers 503. The route takes the `schema` sent by the client after checking its shape (`documentsChatBody`), not against the template files.

### Library (`client/features/documents/lib/`)

| Export                | Signature                                           | Contract                                                                                                     |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `FILL_FIELDS_TOOL`    | `"fill_fields"`                                     | Tool name shared by the route and the hook                                                                   |
| `loadTemplateIndex`   | `() => Promise<TemplateEntry[]>`                    | Fetches `/templates/index.json`, `cache: "no-store"`; throws on non-2xx                                      |
| `loadTemplateSchema`  | `(template) => Promise<TemplateSchema>`             | Fetches `template.schema`; throws on non-2xx                                                                 |
| `schemaToZod`         | `(schema, "extraction" \| "document") => ZodObject` | See rules below                                                                                              |
| `DATE_PATTERN`        | `RegExp`                                            | `^\d{2}\/\d{2}\/\d{4}$`                                                                                      |
| `isEmptyValue`        | `(value) => boolean`                                | `undefined`, or a string that is empty after trimming                                                        |
| `pickExtractedValues` | `(schema, output) => FieldValues`                   | Filters a tool output down to schema fields with non-empty scalar values                                     |
| `requiredProgress`    | `(schema, values) => { filled, total }`             | Counts required fields considered filled                                                                     |
| `recordSources`       | `(sources, names, source) => FieldSources`          | Copy of `sources` with each name set to `"assistant"` or `"user"`                                            |
| `sourceTag`           | `(source, value) => "IA" \| "editado" \| undefined` | `undefined` when no source or `isEmptyValue(value)`; otherwise `IA` for `assistant`, `editado` for `user`    |
| `validateForDocument` | `(schema, values) => DocumentValidation`            | `{ ok: true, values }` with empty values dropped and unset booleans as `false`, or `{ ok: false, problems }` |
| `renderDocx`          | `(template, values) => Promise<void>`               | Fetches the `.docx`, renders, triggers download; throws on fetch or template errors                          |

### Feature layout (`client/features/documents/`)

`app/(app)/documents/page.tsx` renders only `DocumentWorkspace` (imported from `@/features/documents`) in a full-height column with no padding and no `PageHeader`, because the top bar breadcrumb already names the page; `app/api/documents/chat/route.ts` declares `maxDuration = 60` and re-exports `handleDocumentsChat` (from `@/features/documents/server`) as `POST`. Everything else lives in the feature:

| File                                 | Role                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `index.ts`                           | Public client entry: exports `DocumentWorkspace` only                                                         |
| `server/index.ts`                    | Public server entry: exports `handleDocumentsChat` only                                                       |
| `server/chat-handler.ts`             | Validates the request, streams the model and defines the `fill_fields` tool                                   |
| `server/instructions.ts`             | `buildInstructions(templateId, schema)`: the system prompt                                                    |
| `hooks/use-document-filling.ts`      | All client state and actions: template list, schema, values, field sources, problems, generation              |
| `components/document-workspace.tsx`  | Client entry point; switches between picker, loading state and chat + form panel; holds the narrow-screen tab |
| `components/template-picker.tsx`     | "Novo documento" gallery shown while no template is selected                                                  |
| `components/template-preview.tsx`    | Decorative A4 sketch with highlighted blanks; the same drawing for every template                             |
| `components/template-select.tsx`     | Borderless `Select` used as the chat header title for switching templates                                     |
| `components/workspace-tabs.tsx`      | "Conversa" / "Campos x/y" switch shown below `lg`                                                             |
| `components/form-panel.tsx`          | Segmented progress header, `FieldList`, `GenerationProblems` and the "Gerar documento" button                 |
| `components/field-list.tsx`          | Fields grouped under "Obrigatórios" / "Opcionais", status dot; `{{tag}}` shown on label hover                 |
| `components/field-control.tsx`       | The input for one field, chosen by `type`, without border or background                                       |
| `components/generation-problems.tsx` | "Corrija antes de gerar" list; renders nothing when empty                                                     |
| `lib/`                               | Pure logic and data access listed above; no React                                                             |

The chat is the shared `Chat` (`components/chat/chat.tsx`): props `endpoint`, `body?`, `onToolResult?(toolName, output)`, `placeholder?`, `emptyState?`, `history?`, `title?`, `className?`. The workspace passes `title={<TemplateSelect …/>}`, so the template switcher replaces the "Moura AI" label in the chat header, and `className="rounded-none border-0 bg-transparent"`, so the chat has no card frame and sits on the page background. It also passes `history={{ module: "documents", context: { templateId } }}`, which enables "Histórico" and attachments when Supabase is configured. `body` is sent with every message; `onToolResult` fires once per tool call id when the part reaches `output-available`; the empty state shows only the avatar and `emptyState`, and the `placeholder` carries the example message.

## Data shapes

```jsonc
// index.json entry
{
  "id": "example",                                  // used in the file name and as the Chat key
  "name": "Exemplo – Formulário",                   // picker and selector label (shown to users)
  "type": "docx",                                   // only value supported
  "file": "/templates/cbmsc/example.docx",          // path under public/, leading slash
  "schema": "/templates/cbmsc/example.schema.json"
}

// schema field
{
  "name": "area_m2",          // must equal the tag name in the .docx; snake_case English
  "type": "number",           // "string" | "number" | "date" | "boolean"
  "label": "Área construída (m²)", // required; panel label and generation problems, Portuguese, 1–80 chars
  "description": "Área total construída do imóvel, em metros quadrados", // LLM hint + panel tooltip, Portuguese
  "required": true            // optional, defaults to false
}

// POST /api/documents/chat body (built by Chat + AI SDK transport)
{
  "id": "3b241101-…", "trigger": "submit-message",  // added by the AI SDK; id = the chat's UUID, used to save it
  "messages": [/* UIMessage[] */],
  "templateId": "example",
  "schema": { "fields": [/* … */] }
}

// fill_fields tool input === tool output (execute echoes it)
{ "company_name": "Padaria Silva", "area_m2": 750, "floor_count": 2 }   // any subset of fields
```

Value types in form state (`FieldValues`): `string` for `string` and `date`, `number` for `number`, `boolean` for `boolean`, `undefined` for empty. Numbers are plain (`750`, not `"750 m²"`); dates are `DD/MM/AAAA` strings.

The example template (`cbmsc/example`) has `company_name`, `address`, `area_m2`, `occupancy`, `floor_count` (all required) and `issue_date` (optional date).

## Rules and behavior

### `schemaToZod`

| `type`    | `extraction` mode              | `document` mode            |
| --------- | ------------------------------ | -------------------------- |
| `string`  | `z.string()`                   | `z.string().trim().min(1)` |
| `number`  | `z.number()`                   | same                       |
| `boolean` | `z.boolean()`                  | same                       |
| `date`    | string matching `DATE_PATTERN` | same                       |

Every field is `.optional()` in `extraction`. In `document`, only fields with `required: true` are required. `description` is attached via `.describe()` and reaches the model through the tool's JSON Schema (dates get ` (formato DD/MM/AAAA)` appended). The generated object has `additionalProperties: false`.

### Chat route

1. Reject with 500 if no AI provider is configured, 400 if `schema.fields` is empty.
2. Model: `resolveChatModel()`, the provider and model saved on `/admin` (see `client/docs/llm-configuration.md`).
3. System instructions are in English and list every field as `name (type, required): description`. They require: never invent data, ask when information is missing, omit unknown fields, call `fill_fields` with new or corrected fields only, plain numbers, `DD/MM/AAAA` dates, and always reply in Brazilian Portuguese.
4. `fill_fields` runs server-side and returns its input unchanged. `stopWhen: isStepCount(5)` lets the model reply in text after the tool call within the same request.
5. Stream errors are forwarded to the client with the raw error message (not masked).
6. When history is available, the chat is saved with `module: "documents"` and `context: { templateId }` once the response finishes (`chatPersistence`, see `client/docs/chat-history.md`).

### Merging tool output into the form (`handleToolResult`)

1. Ignore results from tools other than `fill_fields`.
2. `pickExtractedValues`: keep only keys present in the current schema whose value is a string, number or boolean and not empty/whitespace.
3. Shallow-merge into the current values; extracted keys overwrite, untouched keys keep their value (including manual edits).
4. Mark every extracted key as written by `assistant` (`recordSources`).
5. Clear the "Corrija antes de gerar" list.

### Form panel

| `type`    | Control                                                              | Missing highlight (after a generate attempt) | Filled check                   |
| --------- | -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| `string`  | auto-growing `Textarea` (newlines become line breaks in the `.docx`) | required and empty/whitespace                | non-empty                      |
| `number`  | `Input type="number"`; unparsable or empty → `undefined`             | required and empty                           | has a number                   |
| `date`    | `Input` text, placeholder `DD/MM/AAAA`; not validated while typing   | required and empty                           | non-empty (format not checked) |
| `boolean` | `Switch`                                                             | never (a boolean always has a value)         | never                          |

Fields are listed in schema order inside two groups, "Obrigatórios" (`required: true`) and "Opcionais"; a group with no fields is not rendered, and there is no `*` required mark. Each field is a row: status dot, the `label`, an optional source tag, and the control. Hovering the label shows the `description` and the `{{name}}` tag. Controls have no border, background or focus ring of their own; the row turns `muted` on hover and `accent` while its control has focus. Empty text, number and date controls show the placeholder "Não informado" (`DD/MM/AAAA` for dates).

| Dot                               | When                                      |
| --------------------------------- | ----------------------------------------- |
| Filled `success`                  | "Filled check" above                      |
| Outlined `destructive`, red label | "Missing highlight" above                 |
| Outlined `input`                  | Every other case, including every boolean |

The source tag is `sourceTag(sources[name], value)`: "IA" (`accent`) when the last write came from `fill_fields`, "editado" (`muted`) when it came from the panel, nothing while the value is empty. Any edit in the panel, including typing the same value or toggling a switch, marks the field as `user`; a later `fill_fields` result for that field marks it `assistant` again. Sources reset with the template. Reopening a saved chat replays its tool results, so the fields it fills are tagged "IA".

`FieldList` receives `showMissing` once "Gerar documento" has been clicked for the current template, so a fresh form shows no red marks. Selecting another template resets it.

The panel header shows `<filled> de <total> obrigatórios` and one segment per required field (`requiredProgress`), the first `<filled>` segments in `success`. The segments are not tied to specific fields: they count, in order, how many are filled. A required field counts as filled when it is a `boolean` (always) or its value is not empty — the same emptiness rule as the highlight, not full validation: a malformed date still counts as filled. With no required fields no segments are drawn. Under the button, "Baixa o .docx com o layout original do modelo." is static text.

### "Gerar documento"

1. `validateForDocument`: set every `boolean` field the user never toggled to `false` (the switch already shows "Não"), drop empty values, validate with `schemaToZod(schema, "document")`. A required boolean therefore never fails as missing.
2. On failure, list one line per field: `<label>: obrigatório` when the value is missing, otherwise `<label>: <zod message>` (e.g. `Use o formato DD/MM/AAAA`). Duplicates are removed. Nothing is rendered.
3. On success, `renderDocx`: fetch template → `PizZip` → `Docxtemplater` with `{{`/`}}` delimiters, `paragraphLoop: true`, `linebreaks: true`, `nullGetter: () => ""` and a parser that trims tag names → `render(data)` → Blob → `saveAs`.
4. Values are formatted before rendering: booleans → `Sim`/`Não`, numbers → `toLocaleString("pt-BR")` (`1234.5` → `1.234,5`), strings as-is.
5. File name: `<id>_<company_name>.docx`, with `\ / : * ? " < > |` removed and whitespace runs replaced by `_`. Without a non-empty `company_name`, `<id>.docx`.

### Template lifecycle

With no template selected, the workspace shows the "Novo documento" heading and one `TemplatePreview` sketch per `index.json` entry, labelled with its `name` and `.<type>`; clicking one selects it. After the entries comes a fixed, non-clickable dashed card "Anexos do CBMSC em breve" / "Modelos oficiais". Once a template is selected, the gallery is replaced by the chat (with the template `Select` in its header) and the form panel. There is no way back to the gallery except reloading the page; the `Select` switches between templates directly.

From `lg` (1024px) up, the chat and a 360px form panel sit side by side, separated by the panel's left border. Below `lg`, only one is shown at a time and `WorkspaceTabs` switches between "Conversa" and "Campos <filled>/<total>"; the tab starts on "Conversa", is not reset when the template changes, and tool results fill the fields while the "Campos" tab is hidden.

Selecting a template resets values, problems, the generate-attempt flag and the schema, then loads the new schema. The `Chat` is keyed by template id, so switching templates starts an empty conversation. "Nova conversa" clears only the chat, not the fields. "Histórico" lists only chats held with the selected template; reopening one merges its extracted values over the current fields.

## What this does NOT do

- No server-side rendering of documents and no storage of generated files. Files attached in the chat are stored but not read by the model or used to fill fields.
- The LLM does not see the current panel values. Manual edits are not sent back to the model; it may re-send a field the user has corrected, overwriting the edit.
- No support for loops, conditionals or images in templates beyond what plain docxtemplater tags allow. `{{#field}}` sections receive formatted strings (`"Não"` is truthy), so boolean conditionals do not work as expected.
- `.pptx` (commercial proposal) is not supported; `public/templates/proposal/` is empty.
- No validation that every `{{tag}}` in the `.docx` has a schema field. Tags without a value render as empty strings.
- The file name only uses `company_name`. A template without that field always downloads as `<id>.docx`.

## Gotchas

- **Every chat message answers 400 after adding a template** → a field in its `.schema.json` has no `label` (or one over 80 characters), and `documentsChatBody` uses strict objects. → Give every field a short `label`.
- **Restyling the chat for Documentos also changes Classificação** → `Chat` is shared, and Classificação still shows it as a framed card in a side column. → Change the documents look through the `className` and `title` props in `DocumentWorkspace`, not inside `components/chat/`.
- **Tag renders empty in the output** → tag name differs from the schema `name` (typo, accent, different case) or Word split the tag with formatting. → Retype the whole tag in one go with uniform formatting; check spelling against the schema.
- **`Falha ao gerar o documento`** → docxtemplater threw while parsing (unbalanced `{{`, a tag split by a field code or smart quotes). Details are in the browser console (`Failed to render document`).
- **Tags with inner spaces** → `{{ field }}` works only because of the custom trimming parser in `renderDocx`; docxtemplater's default parser would look up `" field "` and render empty.
- **New template does not show up** → `index.json` is invalid JSON, still uses the old Portuguese keys (`nome`, `arquivo`), or `file`/`schema` lack the leading `/`. The page shows "Não foi possível carregar…" or the card has no label.
- **Chat shows `Erro: …` immediately** → no model configured on `/admin` ("Nenhum modelo de IA configurado…"), a wrong key, or an invalid model id; provider messages are shown as-is.
- **Number typed as `750,5` in the panel** → `type="number"` inputs follow the browser locale; an unparsable value becomes empty and the field is flagged as missing.

## Setup

- Supabase configured with `SUPABASE_SERVICE_ROLE_KEY`, and a provider, model and key saved on `/admin`; see `.env.example` at the repo root and `client/docs/llm-configuration.md`.
- `pnpm run create-template` (in `client/`) regenerates `public/templates/cbmsc/example.docx` using the `docx` package.
