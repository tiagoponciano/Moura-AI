# Floor plan conversion

How the Plantas module (`/floor-plans`) turns a floor plan into a DXF or DWG. Describes the code as it is now. The conversion itself is done by the DWG service, described in `client/docs/dwg-service.md`.

## What this is

The user picks a plan (PDF, JPEG or PNG) in the side panel and sees it. They type the drawing's scale or press "Ler", and download the result as DXF or DWG. The app sends the file to the DWG service, which converts it with code. A model takes part only in "Ler", and then it sees two small crops of the plan (the title block and the scale strip), never the whole plan. The module's status in `lib/modules.ts` is still `preview`.

Invariants:

- **Nothing is saved.** The file stays in the browser and in the request that converts it; the app stores neither the plan nor the result.
- **The model never decides the output.** It reports a scale that is written on the plan or `null`; code checks it is a whole number from 1 to 5000, and the user can edit it before converting.
- The chat beside the panel is still the fixed "in preparation" reply (`NOT_AVAILABLE_REPLY`): it calls no model and is not saved. The conversion does not go through it.

## Surface

### HTTP

Both routes need a signed-in, approved user (`client/docs/authentication.md`) and answer `503` when `DWG_SERVICE_URL` or `DWG_SERVICE_TOKEN` is not set.

| Method | Path                       | Takes                                                         | Returns                                                                                           |
| ------ | -------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST` | `/api/floor-plans/convert` | multipart `file`, `format` (`dxf` or `dwg`), optional `scale` | The file as an attachment, with `X-Mode` (`vector` or `raster`) and `X-Warnings` from the service |
| `POST` | `/api/floor-plans/scale`   | multipart `file`                                              | `{ scale: number \| null, evidence: string }`                                                     |
| `POST` | `/api/floor-plans/chat`    | the chat's JSON                                               | The fixed reply                                                                                   |

`convert` errors: 400 invalid form, format or scale, 422 a file that is not a PDF, JPEG or PNG (or empty), 413 over 20 MB, 501 `A conversão para DWG não está disponível. Baixe o DXF.`, 502 when the service fails. `scale` errors: 422 invalid file, 429 when the chat quota is used up, 500 when no model is configured, 502 when the crops or the model fail. "Ler" spends one unit of the chat quota.

### Library and server (`client/features/floor-plans/`)

| Export                                        | File                                 | Contract                                                                                                      |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `checkFloorPlanFile({ mimeType, sizeBytes })` | `lib/floor-plan-file.ts`             | `"unsupported"` (not PDF, JPEG or PNG), `"empty"`, `"too_large"` (over 20 MB) or `undefined`                  |
| `parseScale(text)`                            | `lib/floor-plan-conversion.ts`       | `1:100`, `1 / 100` or `100` → 100; otherwise, or outside 1 to 5000, `undefined`                               |
| `parseWarnings(header)`                       | `lib/floor-plan-conversion.ts`       | The Portuguese message of each code of `X-Warnings`; an unknown code stays as it came                         |
| `useFloorPlanConversion(plan)`                | `hooks/use-floor-plan-conversion.ts` | The scale text, `readScale()`, `convert(format)`, the last outcome, notices and errors; `reset()` clears them |

## Rules and behavior

1. Choosing a file: only the first file of a drop is read. `checkFloorPlanFile` runs and the message shows under the drop zone; a valid file replaces the zone with its name and a preview (an `iframe` for a PDF, an `img` for an image). Choosing or removing a plan clears the scale and the last result.
2. "Ler": sends the file to `/api/floor-plans/scale`. The server asks the DWG service for the crops, then the model reads them and answers a scale written on the plan or `null`. A number fills the scale field as `1:N`; `null` shows "A escala não está escrita na planta. Informe-a abaixo."
3. Scale: empty means the drawing comes out in paper millimeters; `1:N` multiplies every coordinate by N, so the drawing is at real size. A value that `parseScale` refuses shows "Use o formato 1:100." and disables the downloads.
4. "Baixar DXF" and "Baixar DWG": convert and download `planta.dxf` or `planta.dwg`. The panel then shows the origin (`PDF vetorial` keeps the original measures, `Imagem` is a trace) and the scale used, and lists the service's quality warnings.
5. Layout: chat on the left, a 360 px side panel on the right from `lg` up; below `lg`, `WorkspaceTabs` switches between "Conversa" and "Planta 0/1" / "Planta 1/1".

## What this does NOT do

- No OCR, layers by meaning, blocks or arcs (see the DWG service's limits). Everything is one `LINHAS` layer, plus `TEXTO` for the texts of vector PDFs.
- The plan and the result are not saved, and no chat history exists for this module (`chat_module` has no `floor-plans` value).
- The chat does not drive the conversion; it still answers with the fixed reply.
- The scale read by the model is not stored; edit the field to correct it.
- DWG depends on `dxf2dwg` being installed in the service; otherwise only DXF works.
- It has not been tried on real Moura plans.

## Gotchas

- "O serviço de conversão não está configurado." → `DWG_SERVICE_URL` and `DWG_SERVICE_TOKEN` are not set in the app's environment → set both, pointing at the DWG service and its token.
- "Baixar DWG" answers that DWG is not available → the service has no `dxf2dwg` → download the DXF.
- "Ler" never finds a scale → the title block is not in the bottom-right corner, or the scale is not written → type it.
- The preview is blank on some mobile browsers → they do not render PDFs in an `iframe` → use "Abrir em nova aba".
- The preview shows a broken-document icon → the CSP blocks the `blob:` frame → `frame-src` in `client/next.config.ts` must include `blob:` (see `client/docs/security-headers.md`).

## Setup

`DWG_SERVICE_URL` (base URL, no trailing slash) and `DWG_SERVICE_TOKEN` in the app's server environment; locally, `docker compose up -d dwg` gives `http://127.0.0.1:3003` with token `local-only`. "Ler" also needs a configured model (`client/docs/llm-configuration.md`).
