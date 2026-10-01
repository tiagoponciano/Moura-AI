# Moura AI

Internal platform for Moura Soluções em Engenharia (fire-prevention projects in Santa Catarina). A sidebar groups three modules, each with its own chatbot:

| Module | Route | Status |
|---|---|---|
| Documentos | `/documentos` | Working — fills CBMSC forms (`.docx`) without touching the layout |
| Classificação | `/classificacao` | Placeholder |
| Plantas (PDF → DWG) | `/plantas` | Placeholder |

Core principle of Documentos: **the LLM never writes the document.** It only extracts data from the conversation into a validated JSON object. Deterministic code (docxtemplater, in the browser) injects that JSON into the original `.docx` template, which stays intact.

## Architecture

- pnpm workspace; all app code lives in `client/` (Next.js App Router, TypeScript, Tailwind, shadcn/ui).
- No separate backend and no database. The only server-side code is the route handler `client/app/api/chat/route.ts`, which holds the LLM key and streams the chat (Vercel AI SDK + Anthropic).
- Documents are rendered in the browser with `docxtemplater` + `pizzip` and downloaded with `file-saver`.

Feature details: [`client/docs/document-filling.md`](client/docs/document-filling.md).

## Running locally

Requirements: Node.js 22+ and pnpm 10.

```bash
pnpm install
cp .env.example client/.env.local   # then fill in ANTHROPIC_API_KEY
pnpm run dev
```

Open <http://localhost:3000/documentos>, pick "Exemplo – Formulário" and describe the property in the chat.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Anthropic API key. Read only in `app/api/chat/route.ts`; never prefix it with `NEXT_PUBLIC_`. |
| `LLM_MODEL` | no | Anthropic model id. Defaults to `claude-sonnet-4-6`. |

Other scripts:

| Command | Where | What it does |
|---|---|---|
| `pnpm run build` | root | Production build of the client |
| `pnpm run lint` | root | ESLint on the client |
| `pnpm run create-template` | `client/` | Regenerates `public/templates/bombeiro/exemplo.docx` |

## Adding a new template

1. Open the original `.docx` in Word and replace each blank with a tag `{{ field_name }}` (snake_case, no accents). Keep everything else untouched — tables, fonts and logos are preserved.
2. Save it under `client/public/templates/<group>/<name>.docx` (e.g. `bombeiro/` for CBMSC annexes).
3. Create `<name>.schema.json` next to it:

   ```json
   {
     "campos": [
       { "nome": "razao_social", "tipo": "string", "descricao": "Razão social do proprietário do imóvel", "obrigatorio": true }
     ]
   }
   ```

   `nome` must match the tag in the `.docx`. Supported `tipo` values: `string`, `number`, `date` (`DD/MM/AAAA`), `boolean`. The `descricao` is shown to the LLM and used as the field label, so write it in Portuguese and be specific.
4. Add an entry to `client/public/templates/index.json`:

   ```json
   { "id": "<name>", "nome": "<Label shown in the selector>", "tipo": "docx", "arquivo": "/templates/<group>/<name>.docx", "schema": "/templates/<group>/<name>.schema.json" }
   ```

No code change or restart is needed; reload `/documentos`.

## Known limitations

- The commercial proposal (`.pptx` with photos) is not supported yet. Inserting images with docxtemplater requires a paid module; the approach is still to be decided. `client/public/templates/proposta/` is reserved for it.
- No authentication or persistence: the conversation and the filled fields live only in the browser tab.
