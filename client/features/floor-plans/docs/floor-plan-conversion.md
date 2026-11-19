# Floor plan conversion

How the Plantas module (`/floor-plans`) turns a floor plan into a DXF or DWG. Describes the code as it is now. What the app cannot do itself is done by the DWG service, described in `client/docs/dwg-service.md`.

## What this is

The user picks a plan (PDF, JPEG or PNG) in the side panel and sees it. They type the drawing's scale or press "Ler", and download the result as DXF or DWG. A vector PDF (a CAD export) to DXF is converted by the app itself, so it works without any service; DWG, images and scanned PDFs go to the DWG service. Both convert with code. A model takes part only in "Ler", and then it sees two small crops of the plan (the title block and the scale strip), never the whole plan.

Invariants:

- **Where a plan is converted:**

  | Plan                                     | DXF     | DWG     |
  | ---------------------------------------- | ------- | ------- |
  | PDF with at least 20 strokes (vector)    | The app | Service |
  | PDF with fewer strokes (scan), JPEG, PNG | Service | Service |

  Without the service, the cases it handles answer 503 with a message that says what is missing; the app's own case keeps working.

- **Files are kept only in a chosen project.** Without a project, the file stays in the browser and in the request that converts it, and the app stores nothing. With one, the browser also keeps the converted file and the plan in the project's files (see `features/projects/docs/project-files.md`), after the download.
- **The model never decides the output.** It reports a scale that is written on the plan or `null`; code checks it is a whole number from 1 to 5000, and the user can edit it before converting.
- The chat beside the panel is still the fixed "in preparation" reply (`NOT_AVAILABLE_REPLY`): it calls no model and is not saved. The conversion does not go through it.

## Surface

### HTTP

Every route needs a signed-in, approved user (`client/docs/authentication.md`). Without `DWG_SERVICE_URL` or `DWG_SERVICE_TOKEN`, `scale` always answers `503`, and `convert` answers `503` for what needs the service (table above).

| Method | Path                       | Takes                                                         | Returns                                                                                               |
| ------ | -------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `POST` | `/api/floor-plans/convert` | multipart `file`, `format` (`dxf` or `dwg`), optional `scale` | The file as an attachment, with `X-Mode` (`vector` or `raster`) and `X-Warnings` (empty from the app) |
| `POST` | `/api/floor-plans/scale`   | multipart `file`                                              | `{ scale: number \| null, evidence: string }`                                                         |
| `POST` | `/api/floor-plans/chat`    | the chat's JSON                                               | The fixed reply                                                                                       |

`convert` errors: 400 invalid form, format or scale, 422 a file that is not a PDF, JPEG or PNG (or empty), 422 `Não foi possível ler este PDF.` when the app cannot open a PDF sent for DXF, 413 over 20 MB, 503 `A conversão para DWG precisa do serviço de conversão…` or `Esta planta não tem linhas vetoriais…` without the service, 501 `A conversão para DWG não está disponível. Baixe o DXF.`, 502 when the service fails. `scale` errors: 422 invalid file, 429 when the chat quota is used up, 500 when no model is configured, 502 when the crops or the model fail. "Ler" spends one unit of the chat quota.

### Library and server (`client/features/floor-plans/`)

| Export                                        | File                                 | Contract                                                                                                      |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `checkFloorPlanFile({ mimeType, sizeBytes })` | `lib/floor-plan-file.ts`             | `"unsupported"` (not PDF, JPEG or PNG), `"empty"`, `"too_large"` (over 20 MB) or `undefined`                  |
| `parseScale(text)`                            | `lib/floor-plan-conversion.ts`       | `1:100`, `1 / 100` or `100` → 100; otherwise, or outside 1 to 5000, `undefined`                               |
| `parseWarnings(header)`                       | `lib/floor-plan-conversion.ts`       | The Portuguese message of each code of `X-Warnings`; an unknown code stays as it came                         |
| `useFloorPlanConversion(plan)`                | `hooks/use-floor-plan-conversion.ts` | The scale text, `readScale()`, `convert(format)`, the last outcome, notices and errors; `reset()` clears them |
| `readVectorPdf(pdf)`                          | `lib/vector-pdf.ts`                  | The first page's lines and texts in millimeters, or `undefined` under 20 strokes; throws on an unreadable PDF |
| `scalePlan(plan, factor)`                     | `lib/plan-geometry.ts`               | Every coordinate and text height times `factor`                                                               |
| `planToDxf(plan)`                             | `lib/plan-dxf.ts`                    | The plan as an R12 DXF in millimeters, lines on `LINHAS`, texts on `TEXTO`                                    |

### Converting a vector PDF in the app

`readVectorPdf` reads the PDF with `unpdf` (a build of pdf.js for serverless functions, with no worker file), the same way the service reads it with PyMuPDF:

1. Every painted path of the first page becomes straight lines, through the page's transforms (`cm`, saved states, form XObjects). A closed path gets its closing line; a curve becomes 6 short lines. Clipping paths are not painted and are left out. Zero-length lines are dropped.
2. Points are converted to millimeters from the page's lower left corner, y up (`PT_TO_MM` = 25.4 / 72).
3. Fewer than 20 strokes means a scan or a photo inside a PDF: `undefined`, and the route goes to the service.
4. Each text item becomes a `TEXT` at its baseline origin, with the font's height; empty items are skipped. Rotation of a text is not kept.

`planToDxf` writes R12 (`AC1009`): no handles, no objects section, `$INSUNITS` 4 (millimeters). R12 is not UTF-8, so `dxfText` writes any character outside printable ASCII as `\U+XXXX` (`Área` → `\U+00C1rea`), which CAD programs show as the letter. Text heights under 0.5 mm are written as 0.5. On a real plan of 72,462 lines, the app and the service give the same lines within 0.01 mm (pdf.js keeps path coordinates in single precision).

## Rules and behavior

1. Choosing a file: only the first file of a drop is read. `checkFloorPlanFile` runs and the message shows under the drop zone; a valid file replaces the zone with its name and a preview (an `iframe` for a PDF, an `img` for an image). Choosing or removing a plan clears the scale and the last result.
2. "Ler": sends the file to `/api/floor-plans/scale`. The server asks the DWG service for the crops, then the model reads them and answers a scale written on the plan or `null`. A number fills the scale field as `1:N`; `null` shows "A escala não está escrita na planta. Informe-a abaixo."
3. Scale: empty means the drawing comes out in paper millimeters; `1:N` multiplies every coordinate by N, so the drawing is at real size. A value that `parseScale` refuses shows "Use o formato 1:100." and disables the downloads.
4. "Baixar DXF" and "Baixar DWG": convert and download `planta.dxf` or `planta.dwg`. The panel then shows the origin (`PDF vetorial` keeps the original measures, `Imagem` is a trace) and the scale used, and lists the service's quality warnings.
5. Layout: chat on the left, a 360 px side panel on the right from `lg` up; below `lg`, `WorkspaceTabs` switches between "Conversa" and "Planta 0/1" / "Planta 1/1".

## What this does NOT do

- No OCR, layers by meaning, blocks or arcs (see the DWG service's limits). Everything is one `LINHAS` layer, plus `TEXTO` for the texts of vector PDFs.
- Without a chosen project the plan and the result are not saved, and no chat history exists for this module (`chat_module` has no `floor-plans` value).
- The chat does not drive the conversion; it still answers with the fixed reply.
- The scale read by the model is not stored; edit the field to correct it.
- DWG is only made by the service, with `dxf2dwg`; the app cannot write DWG.
- The app reads only the first page of a PDF and ignores the page's `/Rotate`, so a page rotated in the PDF comes out unrotated.
- It has not been tried on real Moura plans.

## Gotchas

- "A conversão para DWG precisa do serviço de conversão…" or "Esta planta não tem linhas vetoriais…" → `DWG_SERVICE_URL` and `DWG_SERVICE_TOKEN` are not set in the app's environment → download the DXF of a vector PDF, or set both, pointing at the DWG service and its token.
- A PDF exported from CAD comes out with its names as many short lines and no `TEXTO` → the PDF draws its letters as outlines instead of text → nothing to fix in the app; the drawing is still exact.
- The DXF of a vector PDF differs from the service's (R12, not R2010) → expected; both keep the same lines and layers, and `ezdxf`'s audit finds no error in either.
- "Baixar DWG" answers that DWG is not available → the service has no `dxf2dwg` → download the DXF.
- "Ler" never finds a scale → the title block is not in the bottom-right corner, or the scale is not written → type it.
- The preview is blank on some mobile browsers → they do not render PDFs in an `iframe` → use "Abrir em nova aba".
- The preview shows a broken-document icon → the CSP blocks the `blob:` frame → `frame-src` in `client/next.config.ts` must include `blob:` (see `client/docs/security-headers.md`).

## Setup

None for a vector PDF to DXF. For the rest, `DWG_SERVICE_URL` (base URL, no trailing slash) and `DWG_SERVICE_TOKEN` in the app's server environment; locally, `docker compose up -d dwg` gives `http://127.0.0.1:3003` with token `local-only`. "Ler" also needs a configured model (`client/docs/llm-configuration.md`).

## Linked to a project

The tab shows the project picker (shared with Documents and Classification) and, under the result, "Plantas do projeto". After each conversion the app keeps a record of it for the chosen project: the file name, the mode the service used (`vector` or `raster`), the scale and the format.

| Piece                                 | File                                     | Contract                                                                                                        |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /api/floor-plans/projects/[id]`  | `server/project-plans-handler.ts`        | `{ plans }`, the latest 20 of the project, newest first                                                         |
| `POST /api/floor-plans/projects/[id]` | `server/project-plans-handler.ts`        | `{ fileName, mode, scale?, format }` → `201 { plan }`; any other key is a 400                                   |
| `public.project_floor_plans`          | `20261116000100_project_floor_plans.sql` | One row per conversion; read and insert for approved users, no update or delete                                 |
| `useProjectFloorPlans`                | `hooks/use-project-floor-plans.ts`       | The list of the chosen project; another project reads as loading, a late answer for the previous one is ignored |

With a project, each conversion also keeps its DXF or DWG (`conversion`) and, once per plan in the session, the plan that was uploaded (`plan`) in the project's files; when that fails the line above the panel says so and the download is not held back. Without a project, or without Supabase, nothing is recorded. The migration has to be applied in Supabase; until then both routes answer 500, the panel says it cannot use the project's plans, and the conversion itself keeps working. The record is made after the download starts, so a failed record never blocks the file.

### On the project page

The project page (`/projects/[id]`) has a "Plantas" card (`ProjectFloorPlansSummary`, with `useProjectPlanRows`), one row per recorded conversion with the file name and "<FORMAT> · vetorial|imagem · 1:<scale> · <date>" (the scale only when there is one). Each row is joined to the project's files by `projectPlanRows` (`lib/project-plan-rows.ts`):

1. "Planta" downloads the latest `plan` file with the conversion's file name.
2. The format button ("DXF" or "DWG") downloads the converted file. It is always named `planta.<format>`, so the name alone cannot tell two conversions apart: the row takes the `conversion` file of that name kept nearest in time to the record, within five minutes either way, and a file goes to one row only.
3. A button is missing when no file matches, as when keeping the file failed or the conversion was recorded before the project kept files.

With no conversion the card says "Nenhuma planta convertida." It lists the same latest 20 conversions as the tab. "Abrir" goes to `/floor-plans`.
