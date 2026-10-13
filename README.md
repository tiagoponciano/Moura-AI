# Moura AI

Internal platform for Moura Soluções em Engenharia (fire-prevention projects in Santa Catarina). The home page (`/`) and a sidebar list three modules, each with its own chatbot:

| Module | Route | Status |
|---|---|---|
| Documentos | `/documents` | Working — fills CBMSC forms (`.docx`) without touching the layout |
| Classificação | `/classification` | Preview — lists required fire protection systems from four key questions, using a provisional rule set |
| Plantas (PDF → DWG) | `/floor-plans` | Placeholder |

Core principle of Documentos: **the LLM never writes the document.** It only extracts data from the conversation into a validated JSON object. Deterministic code (docxtemplater, in the browser) injects that JSON into the original `.docx` template, which stays intact.

## Architecture

- pnpm workspace; all app code lives in `client/` (Next.js App Router, TypeScript, Tailwind, shadcn/ui).
- The backend is the Next.js app itself plus Supabase; there is no separate server. Route handlers under `client/app/api/` hold the LLM key and stream the chats (Vercel AI SDK + Anthropic, shared setup in `client/lib/llm.ts`), and list saved chats and attachments.
- Supabase provides Google login (Auth), the database (Postgres with row-level security) and file storage. The schema lives in `supabase/migrations/`. `client/proxy.ts` gates every page and API route: only signed-in users whose profile an admin approved get in.
- Supabase is optional. Without its two environment variables the gate is skipped, chats are not saved and the attach button is hidden; everything else works.
- Documents are rendered in the browser with `docxtemplater` + `pizzip` and downloaded with `file-saver`.
- Code, identifiers, routes, file names and docs are in English; UI copy and field labels are in Portuguese.

Feature details: [`document-filling.md`](client/features/documents/docs/document-filling.md), [`building-classification.md`](client/features/classification/docs/building-classification.md). App-wide: [`app-shell.md`](client/docs/app-shell.md), [`theming.md`](client/docs/theming.md), [`authentication.md`](client/docs/authentication.md), [`chat-history.md`](client/docs/chat-history.md), [`attachments.md`](client/docs/attachments.md).

### Folder layout

The client is organized by feature. `app/` only holds routing files; each module's code lives in `features/<name>/`.

```
client/
├── proxy.ts                      # login gate for every page and API route
├── app/                          # routing only: page.tsx, layout.tsx, route.ts
│   ├── (app)/                    # pages with the sidebar shell (the group is not in the URL)
│   │   ├── page.tsx              # home → @/features/home
│   │   ├── documents/page.tsx    # → @/features/documents
│   │   ├── classification/page.tsx   # → @/features/classification
│   │   └── floor-plans/page.tsx  # → @/features/floor-plans
│   ├── (auth)/                   # /login, /pending, /unauthorized → @/features/auth
│   ├── auth/callback/route.ts    # Google OAuth callback → @/features/auth/server
│   └── api/                      # documents/chat, classification/chat, chats, attachments
├── features/
│   ├── documents/
│   │   ├── index.ts              # public client entry
│   │   ├── components/           # workspace, form panel, field list, template picker…
│   │   ├── hooks/                # use-document-filling
│   │   ├── lib/                  # templates, form value rules, schema → zod, .docx rendering
│   │   ├── server/               # chat handler + prompt (public server entry: server/index.ts)
│   │   └── docs/                 # feature documentation
│   ├── home/                     # home page sections
│   ├── classification/           # key questions, provisional rules, chat
│   ├── floor-plans/              # placeholder
│   └── auth/                     # login, pending and unauthorized cards; OAuth callback
├── components/
│   ├── ui/                       # shadcn primitives (generated, not formatted by prettier)
│   ├── layout/                   # app shell: sidebar, breadcrumb, theme toggle, user menu
│   ├── chat/                     # generic assistant chat, history menu, attachments
│   └── shared/                   # page header, coming-soon placeholder
├── lib/                          # app-wide only: utils, module registry, llm setup, and
│   ├── supabase/                 #   Supabase clients and database types
│   ├── auth/                     #   gate rules, sign-out
│   ├── chat-history/             #   saving and listing chats
│   └── attachments/              #   upload rules and handlers
├── hooks/                        # app-wide hooks (use-mobile, use-chat-attachments)
├── public/
│   ├── brand/                    # logo
│   └── templates/                # .docx templates + schemas (see "Adding a new template")
├── docs/                         # app-wide documentation
└── scripts/                      # one-off generators

supabase/migrations/              # database schema, RLS policies and storage bucket (SQL)
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
| `ANTHROPIC_API_KEY` | yes | Anthropic API key. Read only in `client/lib/llm.ts` (server-side); never prefix it with `NEXT_PUBLIC_`. |
| `LLM_MODEL` | no | Anthropic model id. Defaults to `claude-sonnet-4-6`. |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Supabase project URL, e.g. `https://abcdefgh.supabase.co`. Set it together with the anon key to turn on login, saved chats and attachments. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Supabase anon (public) key. Safe in the browser; access is enforced by row-level security. |
| `ALLOWED_EMAIL_DOMAIN` | no | Only Google accounts from this domain may sign in, e.g. `mourasengenharia.com`. Empty accepts any account (approval is still required). |

With the Supabase variables empty the app runs without login or persistence. To turn them on, follow the Setup section of [`authentication.md`](client/docs/authentication.md): create the project, run the three files in `supabase/migrations/` in order, configure Google in Supabase Auth, and approve the first user with SQL.

Other scripts:

| Command | Where | What it does |
|---|---|---|
| `pnpm run build` | root | Production build of the client |
| `pnpm run lint` | root | ESLint on the client |
| `pnpm run test` | root or `client/` | Vitest, once (`pnpm run test:watch` in `client/` to watch) |
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
- Only conversations are saved. Filled document fields and classification answers live in the browser tab; reopening a saved chat refills only what the assistant extracted.
- Attached files are stored but not read by the assistant.
- Users are approved by hand in the database; there is no admin screen.
