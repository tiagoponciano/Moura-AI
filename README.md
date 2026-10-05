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
- No separate backend and no database. The only server-side code is the route handler `client/app/api/documents/chat/route.ts`, which holds the LLM key and streams the chat (Vercel AI SDK + Anthropic).
- Documents are rendered in the browser with `docxtemplater` + `pizzip` and downloaded with `file-saver`.
- Code, identifiers, routes, file names and docs are in English; UI copy and field labels are in Portuguese.

Feature details: [`document-filling.md`](client/docs/document-filling.md), [`app-shell.md`](client/docs/app-shell.md), [`theming.md`](client/docs/theming.md).

### Folder layout

```
client/
├── app/
│   ├── _components/          # home page sections
│   ├── documents/
│   │   ├── page.tsx          # composes components only
│   │   ├── _components/      # components used only by this route
│   │   └── _hooks/           # state of this route
│   ├── classification/       # placeholder
│   ├── floor-plans/          # placeholder
│   └── api/documents/chat/   # LLM route for the documents module
├── components/
│   ├── ui/                   # shadcn primitives (generated, not formatted by prettier)
│   ├── layout/               # app shell: sidebar, breadcrumb, theme toggle
│   └── shared/               # reused by modules: chat/, page header, coming soon
├── lib/
│   ├── modules.ts            # module registry (sidebar, breadcrumb, home)
│   └── documents/            # templates, form value rules, schema → zod, .docx rendering
├── public/
│   ├── brand/                # logo
│   └── templates/            # .docx templates + schemas (see "Adding a new template")
├── docs/                     # one document per feature
└── scripts/                  # one-off generators
```

Rules of thumb:

- A route's `page.tsx` only imports and composes components. Markup lives in `app/<route>/_components/`, state in `app/<route>/_hooks/`, pure logic in `lib/<module>/`.
- Code used by a single route stays in its private folders; it moves to `components/shared/` or `lib/` once a second route needs it.

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
| `ANTHROPIC_API_KEY` | yes | Anthropic API key. Read only in `app/api/documents/chat/route.ts`; never prefix it with `NEXT_PUBLIC_`. |
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
