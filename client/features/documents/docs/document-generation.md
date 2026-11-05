# Document generation

How a filled form becomes a file now: the `POST /api/documents/generate` route and the PDF microservice in `services/pdf`. For developers changing the output or deploying the service. How the fields get filled is in `document-filling.md`.

## What this is

The assistant only fills fields. Generating is deterministic: the server validates the values, injects them into the tagged `.docx` and, for a PDF, sends that file to a small microservice that converts it with LibreOffice. The microservice exists because LibreOffice does not fit in a Vercel function.

Invariants:

- **No model takes part in generation.** The route receives field values and returns a file.
- **The microservice is stateless and knows nothing about forms.** It is `gotenberg/gotenberg` behind basic auth, with Chromium routes, webhooks and download-from turned off.
- **The server validates again.** The browser's validation is for showing problems; `validateForDocument` runs in the route too, so a request cannot skip required fields.
- **The `.docx` never depends on the microservice.** With it down or not configured, the PDF answers an error and the `.docx` still works.

## Surface

`POST /api/documents/generate`, for approved users (the proxy gates it). `maxDuration = 60`.

| Status | Body or header                                                       | When                                       |
| ------ | -------------------------------------------------------------------- | ------------------------------------------ |
| 200    | The file; `Content-Disposition: attachment; filename*=UTF-8''<name>` | Generated                                  |
| 400    | `{ error }`                                                          | Body does not fit `generateRequestBody`    |
| 401    | `{ error }`                                                          | No session                                 |
| 404    | `Template not found`                                                 | `templateId` is not in `index.json`        |
| 422    | `<label>: obrigatório; …`                                            | Fields fail `validateForDocument`          |
| 502    | `O serviço de PDF não respondeu. Baixe o .docx.`                     | Microservice down, slow (50 s) or erroring |
| 503    | `O serviço de PDF não está configurado. Baixe o .docx.`              | `format: "pdf"` without `PDF_SERVICE_URL`  |
| 503    | `Documents are not configured`                                       | Supabase is not configured                 |

The Portuguese messages are shown in the panel as they are.

| Export                                          | File                       | Contract                                                                |
| ----------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `renderDocx(template, schema, values)`          | `lib/render-docx.ts`       | Bytes of the filled `.docx`; pure                                       |
| `documentFileName(template, values, extension)` | `lib/render-docx.ts`       | `<id>_<company_name>.<extension>`, or `<id>.<extension>` without a name |
| `generateDocument(id, format, values)`          | `lib/generate-document.ts` | Browser call; throws with the server's message                          |
| `loadTemplateFiles(id)`                         | `server/template-files.ts` | Server-only. Entry, schema and file, or `undefined` for an unknown id   |
| `convertDocxToPdf(docx)`                        | `server/pdf-service.ts`    | Server-only. Throws on any failure                                      |

## Data shapes

```jsonc
// POST /api/documents/generate; unknown keys are rejected
{
  "templateId": "in-1-anexo-d", // lowercase letters, digits, _ and -
  "format": "pdf", // or "docx"
  "values": { "requester_name": "João", "external_query": true, "area": 750 },
  // strings, numbers and booleans only
}
```

## Rules and behavior

### When the PDF is generated

| Trigger                                                  | Result                                                                 |
| -------------------------------------------------------- | ---------------------------------------------------------------------- |
| A `fill_fields` result leaves every required field valid | Generates the PDF automatically                                        |
| A `fill_fields` result leaves a field missing            | Nothing; the panel keeps "Gerar PDF" and shows no error                |
| The user edits a field in the panel                      | Discards the current PDF; "Gerar PDF" returns. No automatic generation |
| "Gerar PDF"                                              | Validates, lists problems or generates                                 |
| "Baixar .docx"                                           | Validates, lists problems or downloads; the PDF stays                  |
| Selecting or leaving a template                          | Discards the PDF                                                       |

Only the newest request may show its result: when several `fill_fields` results arrive, or a field changes during a conversion, the older response is ignored. A generation failure appears as the note under the buttons, not as a field problem. The PDF is a blob URL revoked when it is replaced; "Abrir" opens it in a new tab.

### Rendering

`Docxtemplater` with `{{`/`}}` delimiters, `paragraphLoop`, `linebreaks`, and an empty string for missing values. `toDocumentText` formats values: marks print `X` or nothing, other booleans `Sim` or `Não`, numbers with `toLocaleString("pt-BR")` (`1234.5` → `1.234,5`), strings as they are. A blank left empty prints nothing, so its underline does not come back.

### The route reads files from disk

`public/` is not traced into the function by default, so `outputFileTracingIncludes` in `client/next.config.ts` adds `public/templates/**/*` for this route. The template paths come from `index.json`, never from the request.

## What this does NOT do

- No storage: nothing generated is saved. Reloading loses the PDF.
- No sending: the app generates the file and the user files it on e-SCI.
- No PDF preview inside the panel; "Abrir" uses the browser's viewer.
- No per-user limit on generation, unlike the chat quota.
- The PDF comes from LibreOffice, so fonts missing from the container are substituted and layout can differ slightly from Google's own export.

## Gotchas

- **`ENOENT` for a template in production only** → the tracing rule does not match the route, or a new route reads templates. → Check `outputFileTracingIncludes`, and `.next/server/app/api/documents/generate/route.js.nft.json` after a build.
- **The panel says "O serviço de PDF não respondeu"** → the container is down or asleep, or `PDF_SERVICE_USER`/`PDF_SERVICE_PASSWORD` differ from the service's. → `curl -u user:password <url>/health`, and the server log has "Failed to convert a document to PDF". A host that sleeps can exceed the 50 s timeout on the first call.
- **The microservice answers 401** → the `GOTENBERG_API_BASIC_AUTH_*` variables and the app's differ.
- **Never expose the service without its password** → anyone could use it to run files through LibreOffice. The Dockerfile requires basic auth, and the local compose file binds to `127.0.0.1`.

## Setup

Locally: `docker compose up -d pdf` from the repository root, and in `client/.env.local`:

```bash
PDF_SERVICE_URL=http://localhost:3001
PDF_SERVICE_USER=local
PDF_SERVICE_PASSWORD=local-only
```

In production, deploy `services/pdf/Dockerfile` to any container host (it listens on `$PORT`, 3000 by default), set `GOTENBERG_API_BASIC_AUTH_USERNAME` and `GOTENBERG_API_BASIC_AUTH_PASSWORD` to a strong pair there, and set the three `PDF_SERVICE_*` variables in Vercel. It needs about 1 GB of memory.
