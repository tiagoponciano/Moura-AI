# Floor plan conversion

How the Plantas module (`/floor-plans`) works now: the workspace for turning floor plan PDFs into editable DWG, with the upload, the preview and the chat in place and no conversion yet. For developers adding the conversion agent once Moura defines the criteria.

## What this is

The user picks a floor plan PDF in the side panel and sees it in the browser's PDF viewer. The result section lists what a conversion will report (scale, layers, entities) as `—`, and "Baixar DWG" is disabled. The chat answers every message with a fixed reply saying the conversion is being prepared. The module's status in `lib/modules.ts` is `preview`, so the sidebar and the home card show "Prévia".

Invariants:

- **Nothing is converted, uploaded or saved.** The PDF stays in the browser as an object URL and is dropped on "Remover planta", on reload and when another file replaces it. The chat calls no model, spends no quota and is not saved to chat history.
- The panel footer always shows the "Conversão em preparação" notice.

## Surface

### HTTP

| Method | Path                    | Caller           | Returns                                                                                                                                                      |
| ------ | ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `POST` | `/api/floor-plans/chat` | `Chat` component | AI SDK UI message stream with one assistant text, `NOT_AVAILABLE_REPLY`. `400`/`413` from `parseJsonBody` when the body is not a JSON object or is over 1 MB |

Requires a signed-in, approved user like every route (`client/docs/authentication.md`). Body: the AI SDK transport's `{ id, messages, … }`; only its JSON shape is checked.

### Library and server (`client/features/floor-plans/`)

| Export                       | File                      | Contract                                                                                                              |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `checkFloorPlanFile(file)`   | `lib/floor-plan-file.ts`  | `{ mimeType, sizeBytes }` → `"not_pdf"`, `"empty"`, `"too_large"` (over `ATTACHMENT_MAX_BYTES`, 20 MB) or `undefined` |
| `FLOOR_PLAN_PROBLEM_MESSAGE` | `lib/floor-plan-file.ts`  | Portuguese message shown under the drop zone for each problem                                                         |
| `FLOOR_PLAN_ACCEPT`          | `lib/floor-plan-file.ts`  | `accept` of the file input: `.pdf,application/pdf`                                                                    |
| `useFloorPlan()`             | `hooks/use-floor-plan.ts` | `{ plan?: { name, url }, problem?, select(file), clear() }`; revokes the previous object URL when the plan changes    |
| `handleFloorPlansChat(req)`  | `server/chat-handler.ts`  | The route handler above; `NOT_AVAILABLE_REPLY` is the reply text                                                      |

`index.ts` exports `FloorPlansWorkspace`; `server/index.ts` exports `handleFloorPlansChat`.

## Rules and behavior

### Choosing a file

1. Click the drop zone or drop a file on it. Only the first file of a drop is read.
2. `checkFloorPlanFile` runs, in order: MIME type not `application/pdf` → "Envie a planta em PDF."; size 0 → "O arquivo está vazio."; over 20 MB → "O PDF passa de 20 MB.". The message shows under the drop zone and no plan is set.
3. A valid PDF clears the message and replaces the drop zone with its name, an "Abrir em nova aba" link and an `iframe` preview.

The 20 MB limit is the attachments bucket's (`lib/attachments/rules.ts`), where the conversion is expected to read the file from.

### Layout

Same as Classificação: chat on the left, a 360 px side panel on the right from `lg` up; below `lg`, `WorkspaceTabs` switches between "Conversa" and "Planta 0/1" / "Planta 1/1". The panel holds the "Planta" section, the "Resultado" section and, pinned at the bottom, the notice and "Remover planta" (disabled without a plan).

## What this does NOT do

- No conversion, scale detection or layer reading; the result rows are fixed `—` and the download button never enables.
- No upload to Supabase Storage and no link between the PDF and the chat: the chat does not see the file.
- No chat history: `chat_module` has no `floor-plans` value, so the history menu is not shown. Adding it needs a migration and a `database.types.ts` edit.
- No support for scanned images (JPEG/PNG); only PDFs are accepted.

## Gotchas

- **The preview shows a broken-document icon** → the page's CSP blocks the `blob:` frame. → `frame-src` in `client/next.config.ts` must include `blob:` (see `client/docs/security-headers.md`).
- **The preview is blank on some mobile browsers** → they do not render PDFs inside an `iframe`. → Use "Abrir em nova aba".

## Adding the conversion

- Replace the body of `handleFloorPlansChat` with a `streamText` call, keeping the split from `AGENTS.md`: the model extracts structured data through a tool, deterministic code produces the DWG. Add the quota and model checks the other chat handlers use (`client/docs/chat-request-limits.md`), and `maxDuration` in `app/api/floor-plans/chat/route.ts`.
- Upload the PDF with the attachments client so the server can read it, and fill `ConversionResult` from the hook instead of the fixed rows.
- Change the status in `lib/modules.ts` to `available` and remove `ConversionNotice` once the output is validated with Moura.
