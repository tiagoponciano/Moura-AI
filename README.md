# Moura AI

Internal platform for Moura Soluções em Engenharia (fire-prevention projects in Santa Catarina). The home page (`/`) and a sidebar list three modules, each with its own chatbot:

| Module | Route | Status |
|---|---|---|
| Documentos | `/documents` | Working — fills CBMSC forms (`.docx`) without touching the layout |
| Classificação | `/classification` | Placeholder |
| Plantas (PDF → DWG) | `/floor-plans` | Placeholder |

Core principle of Documentos: **the LLM never writes the document.** It only extracts data from the conversation into a validated JSON object. Deterministic code (docxtemplater, in the browser) injects that JSON into the original `.docx` template, which stays intact.

## Architecture

- pnpm workspace; all app code lives in `client/` (Next.js App Router, TypeScript, Tailwind, shadcn/ui).
- No separate backend and no database. The only server-side code is the documents chat (`client/features/documents/server/`, exposed at `/api/documents/chat`), which holds the LLM key and streams the chat (Vercel AI SDK + Anthropic).
- Documents are rendered in the browser with `docxtemplater` + `pizzip` and downloaded with `file-saver`.
- Code, identifiers, routes, file names and docs are in English; UI copy and field labels are in Portuguese.

Feature details: [`document-filling.md`](client/features/documents/docs/document-filling.md). App-wide: [`app-shell.md`](client/docs/app-shell.md), [`theming.md`](client/docs/theming.md).

### Folder layout

The client is organized by feature. `app/` only holds routing files; each module's code lives in `features/<name>/`.

```
client/
├── app/                          # routing only: page.tsx, layout.tsx, route.ts
│   ├── page.tsx                  # home → @/features/home
│   ├── documents/page.tsx        # → @/features/documents
│   ├── classification/page.tsx   # → @/features/classification
│   ├── floor-plans/page.tsx      # → @/features/floor-plans
│   └── api/documents/chat/route.ts   # → @/features/documents/server
├── features/
│   ├── documents/
│   │   ├── index.ts              # public client entry
│   │   ├── components/           # workspace, form panel, field list, template picker…
│   │   ├── hooks/                # use-document-filling
│   │   ├── lib/                  # templates, form value rules, schema → zod, .docx rendering
│   │   ├── server/               # chat handler + prompt (public server entry: server/index.ts)
│   │   └── docs/                 # feature documentation
│   ├── home/                     # home page sections
│   ├── classification/           # placeholder
│   └── floor-plans/              # placeholder
├── components/
│   ├── ui/                       # shadcn primitives (generated, not formatted by prettier)
│   ├── layout/                   # app shell: sidebar, breadcrumb, theme toggle
│   ├── chat/                     # generic assistant chat, reused by features
│   └── shared/                   # page header, coming-soon placeholder
├── lib/                          # app-wide only: utils, module registry
├── hooks/                        # app-wide hooks (shadcn's use-mobile)
├── public/
│   ├── brand/                    # logo
│   └── templates/                # .docx templates + schemas (see "Adding a new template")
├── docs/                         # app-wide documentation
└── scripts/                      # one-off generators
```

Boundaries (enforced by `no-restricted-imports` in `client/eslint.config.mjs`, so `pnpm run lint` fails on a violation):

- `page.tsx` and `route.ts` contain no logic; they import a feature only through `@/features/<name>` or `@/features/<name>/server`.
- A feature never imports another feature, and uses relative imports for its own files.
- `components/`, `lib/` and `hooks/` never import features. Code needed by two features moves up there.
- Route segment config (`maxDuration`, `runtime`…) stays in the `route.ts`/`page.tsx` file itself; Next only reads it from there.

## Running locally

Requirements: Node.js 22+ and pnpm 10.

```bash
pnpm install
cp .env.example client/.env.local   # then fill in ANTHROPIC_API_KEY
pnpm run dev
```

Open <http://localhost:3000/documents>, pick "Exemplo – Formulário" and describe the property in the chat.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Anthropic API key. Read only in `features/documents/server/chat-handler.ts`; never prefix it with `NEXT_PUBLIC_`. |
| `LLM_MODEL` | no | Anthropic model id. Defaults to `claude-sonnet-4-6`. |

Other scripts:

| Command | Where | What it does |
|---|---|---|
| `pnpm run build` | root | Production build of the client |
| `pnpm run lint` | root | ESLint on the client |
| `pnpm run format` | `client/` | Formats the code with Prettier (default config) |
| `pnpm run format:check` | `client/` | Fails if any file is not formatted |
| `pnpm run create-template` | `client/` | Regenerates `public/templates/cbmsc/example.docx` |

## Adding a new template

1. Open the original `.docx` in Word and replace each blank with a tag `{{ field_name }}` (snake_case English, e.g. `company_name`). Keep everything else untouched — tables, fonts and logos are preserved.
2. Save it under `client/public/templates/<group>/<name>.docx` (e.g. `cbmsc/` for CBMSC annexes).
3. Create `<name>.schema.json` next to it:

   ```json
   {
     "fields": [
       { "name": "company_name", "type": "string", "description": "Razão social do proprietário do imóvel", "required": true }
     ]
   }
   ```

   `name` must match the tag in the `.docx`. Supported `type` values: `string`, `number`, `date` (`DD/MM/AAAA`), `boolean`. The `description` is shown to the LLM and used as the field label, so write it in Portuguese and be specific.
4. Add an entry to `client/public/templates/index.json`:

   ```json
   { "id": "<name>", "name": "<Label shown in the selector>", "type": "docx", "file": "/templates/<group>/<name>.docx", "schema": "/templates/<group>/<name>.schema.json" }
   ```

No code change or restart is needed; reload `/documents`.

## Known limitations

- The commercial proposal (`.pptx` with photos) is not supported yet. Inserting images with docxtemplater requires a paid module; the approach is still to be decided. `client/public/templates/proposal/` is reserved for it.
- No authentication or persistence: the conversation and the filled fields live only in the browser tab.
