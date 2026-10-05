# Document filling

How the Documentos module (`/documents`) works now: template registry, chat extraction, the editable form panel and browser-side `.docx` rendering. For developers adding templates or extending the flow.

## What this is

The user picks a template, describes the property in a chat, and downloads the original `.docx` with the blanks filled in. The LLM only extracts values into a JSON object through the `fill_fields` tool; `docxtemplater` writes them into the template in the browser.

Invariants:

- The LLM never produces document content. Anything outside a `{{tag}}` in the `.docx` is copied byte-for-byte.
- The template's `.schema.json` is the single source of truth for field names, types and requiredness — for the tool input, the panel, and pre-render validation.
- Form state lives only in the `useDocumentFilling` hook. Nothing is persisted; reloading or switching templates discards it.

## Surface

### Files under `client/public/templates/`

| Path                         | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `index.json`                 | Array of `TemplateEntry`; populates the picker and the selector          |
| `<group>/<name>.docx`        | Original template with `{{tags}}` (`cbmsc/` for fire-department annexes) |
| `<group>/<name>.schema.json` | Field definitions (`TemplateSchema`)                                     |
| `proposal/`                  | Reserved for the commercial proposal; empty                              |

### HTTP

| Method | Path                  | Caller           | Returns                                                                                                                                                                               |
| ------ | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/api/documents/chat` | `Chat` component | AI SDK UI message stream (SSE). `500 {"error":"ANTHROPIC_API_KEY is not configured"}` without a key; `400 {"error":"Missing template schema"}` if `schema.fields` is empty or missing |

No auth. The route trusts the `schema` sent by the client.

### Library (`client/lib/documents/`)

| Export                | Signature                                           | Contract                                                                            |
| --------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `FILL_FIELDS_TOOL`    | `"fill_fields"`                                     | Tool name shared by the route and the hook                                          |
| `loadTemplateIndex`   | `() => Promise<TemplateEntry[]>`                    | Fetches `/templates/index.json`, `cache: "no-store"`; throws on non-2xx             |
| `loadTemplateSchema`  | `(template) => Promise<TemplateSchema>`             | Fetches `template.schema`; throws on non-2xx                                        |
| `schemaToZod`         | `(schema, "extraction" \| "document") => ZodObject` | See rules below                                                                     |
| `DATE_PATTERN`        | `RegExp`                                            | `^\d{2}\/\d{2}\/\d{4}$`                                                             |
| `isEmptyValue`        | `(value) => boolean`                                | `undefined`, or a string that is empty after trimming                               |
| `pickExtractedValues` | `(schema, output) => FieldValues`                   | Filters a tool output down to schema fields with non-empty scalar values            |
| `requiredProgress`    | `(schema, values) => { filled, total }`             | Counts required fields considered filled                                            |
| `validateForDocument` | `(schema, values) => DocumentValidation`            | `{ ok: true, values }` with empty values dropped, or `{ ok: false, problems }`      |
| `renderDocx`          | `(template, values) => Promise<void>`               | Fetches the `.docx`, renders, triggers download; throws on fetch or template errors |

### Page composition (`client/app/documents/`)

`page.tsx` only renders `PageHeader` and `DocumentWorkspace`. Everything else lives in the route's private folders:

| File                                  | Role                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `_hooks/use-document-filling.ts`      | All state and actions: template list, schema, values, problems, generation          |
| `_components/document-workspace.tsx`  | Client entry point; switches between picker, loading state and chat + form panel    |
| `_components/template-picker.tsx`     | Card grid shown while no template is selected                                       |
| `_components/template-select.tsx`     | `Select` for switching templates once one is chosen                                 |
| `_components/form-panel.tsx`          | Progress header, `FieldList`, `GenerationProblems` and the "Gerar documento" button |
| `_components/field-list.tsx`          | Label, required mark, filled check and `{{tag}}` hint per field                     |
| `_components/field-control.tsx`       | The input for one field, chosen by `type`                                           |
| `_components/generation-problems.tsx` | "Corrija antes de gerar" list; renders nothing when empty                           |

The chat is the shared `Chat` (`components/shared/chat/chat.tsx`): props `endpoint`, `body?`, `onToolResult?(toolName, output)`, `placeholder?`, `emptyState?`, `suggestions?`. `body` is sent with every message; `onToolResult` fires once per tool call id when the part reaches `output-available`; `suggestions` render as chips in the empty state and clicking one sends it immediately.

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
  "description": "Área total construída do imóvel, em metros quadrados", // LLM hint + panel label, Portuguese
  "required": true            // optional, defaults to false
}

// POST /api/documents/chat body (built by Chat + AI SDK transport)
{
  "id": "…", "trigger": "submit-message",           // added by the AI SDK
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

1. Reject with 500 if `ANTHROPIC_API_KEY` is unset, 400 if `schema.fields` is empty.
2. Model: `LLM_MODEL` env var, falling back to `claude-sonnet-4-6`.
3. System instructions are in English and list every field as `name (type, required): description`. They require: never invent data, ask when information is missing, omit unknown fields, call `fill_fields` with new or corrected fields only, plain numbers, `DD/MM/AAAA` dates, and always reply in Brazilian Portuguese.
4. `fill_fields` runs server-side and returns its input unchanged. `stopWhen: isStepCount(5)` lets the model reply in text after the tool call within the same request.
5. Stream errors are forwarded to the client with the raw error message (not masked).

### Merging tool output into the form (`handleToolResult`)

1. Ignore results from tools other than `fill_fields`.
2. `pickExtractedValues`: keep only keys present in the current schema whose value is a string, number or boolean and not empty/whitespace.
3. Shallow-merge into the current values; extracted keys overwrite, untouched keys keep their value (including manual edits).
4. Clear the "Corrija antes de gerar" list.

### Form panel

| `type`    | Control                                                              | Missing highlight (after a generate attempt) | Filled check                   |
| --------- | -------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| `string`  | auto-growing `Textarea` (newlines become line breaks in the `.docx`) | required and empty/whitespace                | non-empty                      |
| `number`  | `Input type="number"`; unparsable or empty → `undefined`             | required and empty                           | has a number                   |
| `date`    | `Input` text, placeholder `DD/MM/AAAA`; not validated while typing   | required and empty                           | non-empty (format not checked) |
| `boolean` | `Switch`                                                             | never (a boolean always has a value)         | never                          |

`FieldList` receives `showMissing` once "Gerar documento" has been clicked for the current template, so a fresh form shows no red borders. Selecting another template resets it.

The panel header shows `<filled>/<total> obrigatórios` and a progress bar (`requiredProgress`). A required field counts as filled when it is a `boolean` (always) or its value is not empty — the same emptiness rule as the highlight, not full validation: a malformed date still counts as filled. With no required fields the bar is full.

### "Gerar documento"

1. `validateForDocument`: drop empty values, validate with `schemaToZod(schema, "document")`.
2. On failure, list one line per field: `<description>: obrigatório` when the value is missing, otherwise `<description>: <zod message>` (e.g. `Use o formato DD/MM/AAAA`). Duplicates are removed. Nothing is rendered.
3. On success, `renderDocx`: fetch template → `PizZip` → `Docxtemplater` with `{{`/`}}` delimiters, `paragraphLoop: true`, `linebreaks: true`, `nullGetter: () => ""` and a parser that trims tag names → `render(data)` → Blob → `saveAs`.
4. Values are formatted before rendering: booleans → `Sim`/`Não`, numbers → `toLocaleString("pt-BR")` (`1234.5` → `1.234,5`), strings as-is.
5. File name: `<id>_<company_name>.docx`, with `\ / : * ? " < > |` removed and whitespace runs replaced by `_`. Without a non-empty `company_name`, `<id>.docx`.

### Template lifecycle

With no template selected, the workspace lists every `index.json` entry as a card; clicking one selects it. Once a template is selected, the cards are replaced by the template `Select`, the chat and the form panel.

Selecting a template resets values, problems, the generate-attempt flag and the schema, then loads the new schema. The `Chat` is keyed by template id, so switching templates starts an empty conversation. "Nova conversa" clears only the chat, not the fields.

## What this does NOT do

- No server-side rendering of documents and no storage of generated files.
- The LLM does not see the current panel values. Manual edits are not sent back to the model; it may re-send a field the user has corrected, overwriting the edit.
- No support for loops, conditionals or images in templates beyond what plain docxtemplater tags allow. `{{#field}}` sections receive formatted strings (`"Não"` is truthy), so boolean conditionals do not work as expected.
- `.pptx` (commercial proposal) is not supported; `public/templates/proposal/` is empty.
- No validation that every `{{tag}}` in the `.docx` has a schema field. Tags without a value render as empty strings.
- The file name only uses `company_name`. A template without that field always downloads as `<id>.docx`.

## Gotchas

- **Tag renders empty in the output** → tag name differs from the schema `name` (typo, accent, different case) or Word split the tag with formatting. → Retype the whole tag in one go with uniform formatting; check spelling against the schema.
- **`Falha ao gerar o documento`** → docxtemplater threw while parsing (unbalanced `{{`, a tag split by a field code or smart quotes). Details are in the browser console (`Failed to render document`).
- **Tags with inner spaces** → `{{ field }}` works only because of the custom trimming parser in `renderDocx`; docxtemplater's default parser would look up `" field "` and render empty.
- **New template does not show up** → `index.json` is invalid JSON, still uses the old Portuguese keys (`nome`, `arquivo`), or `file`/`schema` lack the leading `/`. The page shows "Não foi possível carregar…" or the card has no label.
- **Chat shows `Erro: …` immediately** → missing `client/.env.local`, wrong `ANTHROPIC_API_KEY`, or an invalid `LLM_MODEL` id; the provider message is shown as-is.
- **Number typed as `750,5` in the panel** → `type="number"` inputs follow the browser locale; an unparsable value becomes empty and the field is flagged as missing.

## Setup

- `client/.env.local` with `ANTHROPIC_API_KEY` (and optionally `LLM_MODEL`); see `.env.example` at the repo root.
- `pnpm run create-template` (in `client/`) regenerates `public/templates/cbmsc/example.docx` using the `docx` package.
