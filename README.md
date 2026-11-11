# Moura AI

Internal platform for Moura Soluções em Engenharia (fire-prevention projects in Santa Catarina). The home page (`/`) and a sidebar list three modules, each with its own chatbot:

| Module              | Route             | Status                                                                                                                             |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Documentos          | `/documents`      | Working — fills CBMSC forms (`.docx`) without touching the layout, and opens the official CBMSC forms (always the current version) |
| Classificação       | `/classification` | Preview — lists required fire protection systems from four key questions, using a provisional rule set                             |
| Plantas (PDF → DWG) | `/floor-plans`    | Preview — PDF upload and preview, chat and result panel in place; the conversion itself is not built yet                           |

Core principle of Documentos: **the LLM never writes the document.** It only extracts data from the conversation into a validated JSON object. Deterministic code (docxtemplater, on the server) injects that JSON into the original `.docx` template, which stays intact, and a small microservice (`services/pdf`) converts it to PDF.

## Architecture

- pnpm workspace; all app code lives in `client/` (Next.js App Router, TypeScript, Tailwind, shadcn/ui).
- The backend is the Next.js app itself plus Supabase; there is no separate server. Route handlers under `client/app/api/` stream the chats (Vercel AI SDK with Anthropic, OpenAI or Google, chosen in `client/lib/llm/`), list saved chats and attachments, and serve the admin console.
- Supabase provides Google login (Auth), the database (Postgres with row-level security), file storage and Vault for the AI provider keys. The schema lives in `supabase/migrations/`. `client/proxy.ts` gates every page and API route: only signed-in users whose profile an admin approved get in, and only admins reach `/admin`.
- `/admin` (sidebar "Administração", admins only) approves, rejects and promotes users, picks the AI provider and model, stores each provider's API key and sets the allowed e-mail domain.
- Supabase is optional. Without its two environment variables the gate is skipped, chats are not saved and the attach button is hidden; everything else works.
- Documents are rendered on the server with `docxtemplater` + `pizzip`, and converted to PDF by the microservice in `services/pdf`.
- Code, identifiers, routes, file names and docs are in English; UI copy and field labels are in Portuguese.

Feature details: [`document-filling.md`](client/features/documents/docs/document-filling.md), [`cbmsc-form-templates.md`](client/features/documents/docs/cbmsc-form-templates.md), [`document-generation.md`](client/features/documents/docs/document-generation.md), [`project-fields.md`](client/features/documents/docs/project-fields.md), [`building-classification.md`](client/features/classification/docs/building-classification.md), [`admin-console.md`](client/features/admin/docs/admin-console.md). App-wide: [`app-shell.md`](client/docs/app-shell.md), [`theming.md`](client/docs/theming.md), [`authentication.md`](client/docs/authentication.md), [`chat-history.md`](client/docs/chat-history.md), [`attachments.md`](client/docs/attachments.md), [`llm-configuration.md`](client/docs/llm-configuration.md), [`cbmsc-forms-catalog.md`](client/docs/cbmsc-forms-catalog.md).

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
│   │   ├── floor-plans/page.tsx  # → @/features/floor-plans
│   │   └── admin/page.tsx        # → @/features/admin (admins only)
│   ├── (auth)/                   # /login, /pending, /unauthorized → @/features/auth
│   └── api/                      # documents/chat, classification/chat, chats, attachments, admin/*
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
│   ├── floor-plans/              # PDF upload and preview, conversion stub
│   ├── auth/                     # login (Google popup + code exchange), pending and unauthorized cards
│   └── admin/                    # admin console: users, AI model and keys, allowed domain
├── components/
│   ├── ui/                       # shadcn primitives (generated, not formatted by prettier)
│   ├── layout/                   # app shell: sidebar, breadcrumb, theme toggle, user menu
│   ├── chat/                     # generic assistant chat, history menu, attachments
│   └── shared/                   # page header, brand logo, workspace tabs
├── lib/                          # app-wide only: utils, module registry, and
│   ├── llm/                      #   provider/model catalog and chat model resolution
│   ├── supabase/                 #   Supabase clients (user and service role) and database types
│   ├── auth/                     #   gate rules, admin check, sign-out
│   ├── chat-history/             #   saving and listing chats
│   ├── attachments/              #   upload rules and handlers
│   └── cbmsc-forms/              #   official CBMSC forms catalog: links, titles, Google fetches
├── hooks/                        # app-wide hooks (use-mobile, use-chat-attachments)
├── public/
│   ├── brand/                    # logo
│   └── templates/                # .docx templates + schemas (see "Adding a new template")
├── docs/                         # app-wide documentation
└── scripts/                      # one-off generators

services/pdf/                     # PDF microservice (Dockerfile); see document-generation.md
services/dwg/                     # plan to DXF/DWG microservice; see client/docs/dwg-service.md
supabase/migrations/              # database schema, RLS policies, storage bucket and admin RPCs (SQL)
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
cp .env.example client/.env.local   # then fill in the Supabase variables
pnpm run dev
```

Sign in as an admin, open "Administração", pick the AI provider and model and save its API key. Then open <http://localhost:3000/documents>, open "IN 1 – Anexo D" in the dialog and describe the property in the chat.

| Variable                                                      | Required            | Description                                                                                                                                                                                               |
| ------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                    | for login and chats | Supabase project URL, e.g. `https://abcdefgh.supabase.co`. Set it together with the anon key to turn on login, saved chats and attachments.                                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                               | for login and chats | Supabase anon (public) key. Safe in the browser; access is enforced by row-level security.                                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`                                   | for chats           | Supabase service role key. Server-only, never `NEXT_PUBLIC_`. The chats use it to read the provider, model and key saved on `/admin`; without it every chat answers "Nenhum modelo de IA configurado".    |
| `CRON_SECRET`                                                 | for the daily check | Random string. Server-only. Vercel Cron sends it to `/api/cron/cbmsc-forms`, the daily check of the CBMSC forms page. Without it the route answers 503; "Verificar agora" on `/admin` still works.        |
| `PDF_SERVICE_URL`, `PDF_SERVICE_USER`, `PDF_SERVICE_PASSWORD` | for the PDF         | The microservice in `services/pdf` (`docker compose up -d pdf` locally). Server-only. Without the URL only the `.docx` is generated.                                                                      |
| `DWG_SERVICE_URL`, `DWG_SERVICE_TOKEN`                        | for Plantas         | The microservice in `services/dwg` (`docker compose up -d dwg` locally, token `local-only`). Server-only. Without them plans cannot be converted.                                                         |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`                                | with Supabase       | Google OAuth web client ID, the same one set in Supabase → Providers → Google. Without it the login page shows no button while the gate stays on.                                                         |
| `GOOGLE_CLIENT_SECRET`                                        | with Supabase       | Secret of that same Google client. Server-only, never `NEXT_PUBLIC_`. `/api/auth/google` uses it to trade the popup's code for an ID token; without it the button opens Google's popup but sign-in fails. |
| `ALLOWED_EMAIL_DOMAIN`                                        | no                  | Only Google accounts from this domain may sign in, e.g. `mourasengenharia.com`. A domain saved on `/admin` overrides it. Empty in both accepts any account (approval is still required).                  |

With the Supabase variables empty the app runs without login or persistence, and the chats cannot answer: the AI provider, model and API key exist only in the admin console (see [`llm-configuration.md`](client/docs/llm-configuration.md)). To turn them on, follow the Setup section of [`authentication.md`](client/docs/authentication.md): create the project, run the files in `supabase/migrations/` in filename order, configure Google in Supabase Auth, and make the first admin with SQL. Everyone else is approved on `/admin`.

Other scripts:

| Command                            | Where             | What it does                                               |
| ---------------------------------- | ----------------- | ---------------------------------------------------------- |
| `pnpm run build`                   | root              | Production build of the client                             |
| `pnpm run lint`                    | root              | ESLint on the client                                       |
| `pnpm run test`                    | root or `client/` | Vitest, once (`pnpm run test:watch` in `client/` to watch) |
| `pnpm run format`                  | `client/`         | Formats the code with Prettier (default config)            |
| `pnpm run format:check`            | `client/`         | Fails if any file is not formatted                         |
| `pnpm run prepare-cbmsc-templates` | `client/`         | Regenerates the tagged copies of the official CBMSC forms  |

## Adding a new template

Official CBMSC forms are prepared by `client/scripts/prepare-cbmsc-templates.mjs`, which writes the tagged `.docx`, its schema and its `index.json` entry. The steps and the review are in [`cbmsc-form-templates.md`](client/features/documents/docs/cbmsc-form-templates.md). A template opens from the "Anexos do CBMSC" dialog, so it needs the `cbmsc` object that ties it to a form in the catalog.

## Known limitations

- The commercial proposal (`.pptx` with photos) is not supported yet. Inserting images with docxtemplater requires a paid module; the approach is still to be decided. `client/public/templates/proposal/` is reserved for it.
- Only conversations are saved. Filled document fields and classification answers live in the browser tab; reopening a saved chat refills only what the assistant extracted.
- Attached files are stored but not read by the assistant.
- The first admin is created by hand in the database; `/admin` handles everyone after that.
