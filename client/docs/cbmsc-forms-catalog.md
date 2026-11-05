# CBMSC forms catalog

How the list of official CBMSC forms works now: the database catalog, the "Anexos do CBMSC" dialog on `/documents` and the "Formulários CBMSC" tab on `/admin`. For developers changing any of them.

## What this is

The CBMSC publishes its forms as public Google Docs, reached from "Anexos de INs em vigor" on `https://cbm.sc.gov.br/index.php/sci/instrucoes-normativas`. The `cbmsc_forms` table keeps one row of metadata per form. Users browse the list in a dialog, and the preview and the download come straight from Google. Admins keep the list current by pasting Google links, and a daily check of the CBMSC page warns them when the catalog no longer matches it. Shared code is in `client/lib/cbmsc-forms/`, because both the admin and documents features use it and features cannot import each other.

Invariants:

- **The app never stores or proxies a form's file.** The browser loads Google's `/preview` page in an iframe and follows a plain link to Google's `/export?format=docx`, so every view and download is the version the CBMSC has at that moment. The server only contacts Google during an admin import, a link edit or a site check.
- **The Google Doc id is the form's identity.** It is the primary key and does not change when the CBMSC edits the document. The list itself is the only thing that can go stale.
- **Only active rows reach users.** Admins hide a form with the "Ativo" switch; there is no delete.
- **The site check only warns.** It stores what the site listed and never changes `cbmsc_forms`. An admin applies each change.

## Surface

### API

Errors are `{"error": string}`. `/api/admin/*` is restricted to admins by the proxy (`client/docs/authentication.md`); writes are also refused by RLS.

| Method  | Path                          | Who                                                | Body                                                     | Success                                              | Errors                                                                                                      |
| ------- | ----------------------------- | -------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/documents/forms`        | approved                                           | —                                                        | 200 `{ forms }`, active only                         | 401, 403 `Access not approved`, 503 `Forms catalog is not configured`, 500 `Failed to load forms`           |
| `GET`   | `/api/admin/forms`            | admin                                              | —                                                        | 200 `{ forms }`, all                                 | 401, 403, 503, 500 `Failed to load forms`                                                                   |
| `POST`  | `/api/admin/forms/resolve`    | admin                                              | `{ url }`                                                | 200 `{ drafts }`; saves nothing                      | 400, 401, 403, 422, 502, 503, 500 (see Resolving a link)                                                    |
| `POST`  | `/api/admin/forms`            | admin                                              | `{ forms }`                                              | 204                                                  | 400, 401, 403, 503, 500 `Failed to save forms`                                                              |
| `PATCH` | `/api/admin/forms/:docId`     | admin                                              | any of `{ googleDocId, normative, annex, name, active }` | 204                                                  | 400, 401, 403, 404 `Form not found`, 409, 502, 503, 500 `Failed to update the form`                         |
| `GET`   | `/api/admin/forms/site-check` | admin                                              | —                                                        | 200 `{ check }`, `null` before the first check       | 401, 403, 503, 500 `Failed to load the site check`                                                          |
| `POST`  | `/api/admin/forms/site-check` | admin                                              | —                                                        | 200 `{ check }`                                      | 401, 403, 503, 500 `Failed to save the site check`                                                          |
| `GET`   | `/api/cron/cbmsc-forms`       | Vercel Cron, `Authorization: Bearer <CRON_SECRET>` | —                                                        | 200 `{ status, failures, forms }` (forms is a count) | 401 `Invalid cron secret`, 503 `CRON_SECRET is not configured` or `The service role is not configured`, 500 |

Both lists are sorted by `compareForms`. `POST /api/admin/forms/resolve`, `/api/admin/forms/site-check` and `/api/cron/cbmsc-forms` declare `maxDuration = 60`. The cron route is the one path besides `/api/auth/google` that `resolveGate` lets through without a session, and the only forms route using the service role, because no user exists to read the session of.

### Database (`supabase/migrations/20261105000000_cbmsc_forms.sql`)

| Column          | Type          | Rule                                                               |
| --------------- | ------------- | ------------------------------------------------------------------ |
| `google_doc_id` | `text` PK     | `^[A-Za-z0-9_-]{20,}$`                                             |
| `normative`     | `smallint`    | `> 0`; the IN number (`1` for "IN 1")                              |
| `annex`         | `text`        | `^[A-Z]{1,2}$`; the annex letter (`D`)                             |
| `name`          | `text`        | Trimmed length 1–200                                               |
| `active`        | `boolean`     | Default `true`                                                     |
| `created_at`    | `timestamptz` | Default `now()`                                                    |
| `updated_at`    | `timestamptz` | Set by trigger `cbmsc_forms_touch` on insert and update            |
| `updated_by`    | `uuid`        | Set by the same trigger to `auth.uid()`; `null` on the seeded rows |

| Policy                             | Operation | Who                                           |
| ---------------------------------- | --------- | --------------------------------------------- |
| `Approved users read active forms` | select    | `authenticated`, active rows, `is_approved()` |
| `Admins read all forms`            | select    | `authenticated`, `is_admin()`                 |
| `Admins add forms`                 | insert    | `authenticated`, `is_admin()`                 |
| `Admins update forms`              | update    | `authenticated`, `is_admin()`                 |

`cbmsc_site_check` (`supabase/migrations/20261105000100_cbmsc_site_check.sql`) has a single row (`id = true`) with `checked_at`, `status` (`complete`, `partial`, `failed`), `failures` (count of unreadable Drive files and titles) and `forms` (`jsonb`, `SiteForm[]`). Admins can select, insert and update; the cron writes with the service role.

### Library (`client/lib/cbmsc-forms/`)

| File            | Exports                                                                                                                                                   | Contract                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `types.ts`      | `CbmscForm`, `CbmscFormDraft`, `SiteForm`, `SiteCheck`                                                                                                    | See Data shapes                                                                                    |
| `links.ts`      | `GOOGLE_ID_PATTERN`, `GoogleLink`, `parseGoogleLink(input)`, `googleDocUrls(id)`, `driveDownloadUrl(id)`, `CBMSC_FORMS_PAGE`, `extractDriveFileIds(html)` | Recognizes links and builds Google's URLs; `parseGoogleLink` returns `undefined` for anything else |
| `title.ts`      | `ParsedFormTitle`, `parseFormTitle(title)`, `titleFromContentDisposition(header)`                                                                         | Reads "IN n - Anexo X - name"; file name from a response header                                    |
| `pdf-links.ts`  | `extractGoogleDocIds(pdf)`                                                                                                                                | Unique Google Doc ids linked from a PDF: plain objects first, then Flate streams                   |
| `catalog.ts`    | `compareForms`, `NormativeGroup`, `groupByNormative`, `formLabel`, `FORM_COLUMNS`, `fromFormRow`, `fromSiteCheckRow`                                      | Ordering, grouping, the "IN 1 · Anexo D" label, row mapping                                        |
| `site-check.ts` | `readCbmscSite()`                                                                                                                                         | Server-only. Reads the page, the Drive files and the titles; never throws                          |
| `google.ts`     | `fetchGoogleDocTitle(id)`, `resolveGoogleDocIds(link)`, `fetchCbmscDriveFileIds()`                                                                        | Server-only. Both throw `Error` on any Google failure                                              |

## Data shapes

```jsonc
// CbmscForm, in { forms } responses
{
  "googleDocId": "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
  "normative": 1,          // the IN number, not "IN 1"
  "annex": "D",            // one or two capital letters
  "name": "Formulário para consulta técnica",
  "active": true
}

// CbmscFormDraft, in { drafts } responses
{
  "googleDocId": "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
  "normative": 1,          // null when the title does not follow the pattern
  "annex": "D",            // null when the title does not follow the pattern
  "name": "Formulário para consulta técnica",
  "listed": true           // the catalog already has this Google Doc
}

// POST /api/admin/forms/resolve
{ "url": "https://drive.google.com/file/d/1GZDViVb0Z_feTyvuyv_HwrIhodpo_Fye/view" } // 1–2000 chars after trim

// POST /api/admin/forms: 1–50 forms; unknown keys are rejected
{ "forms": [{ "googleDocId": "1K6Dr…", "normative": 1, "annex": "d", "name": " Consulta " }] }
// annex is trimmed and upper-cased, name is trimmed, normative is an integer from 1 to 999

// PATCH /api/admin/forms/:docId: at least one field; unknown keys are rejected
{ "googleDocId": "1K6Dr…", "active": false }

// SiteCheck, in { check } responses
{
  "checkedAt": "2026-11-05T09:00:03.120Z",
  "status": "complete",    // "partial" | "failed"
  "failures": 0,           // unreadable Drive files and titles; 1 when failed
  "forms": [{ "googleDocId": "1K6Dr…", "normative": 1, "annex": "D", "name": "Formulário para consulta técnica" }]
                           // normative and annex are null when the title is off-pattern
}
```

## Rules and behavior

### Link recognition

`parseGoogleLink` trims the input and accepts only `https`:

| Host               | Path starts with   | Result                   | Meaning                                 |
| ------------------ | ------------------ | ------------------------ | --------------------------------------- |
| `docs.google.com`  | `/document/d/<id>` | `{ kind: "doc" }`        | One form                                |
| `drive.google.com` | `/file/d/<id>`     | `{ kind: "drive-file" }` | A PDF linking to many forms             |
| anything else      | —                  | `undefined`              | Sheets, other hosts, `http`, plain text |

`<id>` is at least 20 characters of letters, digits, `_` and `-`. The server only requests URLs it builds from this id, never the pasted URL.

### Resolving a link

1. `parseGoogleLink`; no match answers 400 "Link não reconhecido. Use um link do Google Docs ou do Google Drive."
2. Doc ids. A doc link is its own single id. A Drive link downloads the file from `drive.usercontent.google.com/download?id=<id>&export=download&confirm=t`, which must be at most 10 MB and start with `%PDF-`, and `extractGoogleDocIds` reads its `/URI` entries from plain objects and Flate-compressed streams, without repeats. The Drive PDFs on the CBMSC page ("Links editáveis IN X.pdf") contain nothing else of use.
3. Titles, in parallel, from the file name in the `Content-Disposition` header of each doc's docx export, the UTF-8 `filename*` first. Each Google request times out after 15 s. A private doc redirects to Google's login page, which has no file name, and fails like a missing one.
4. Any failure in steps 2–3 answers 502 "Não foi possível ler esse link no Google. Confira se ele é público." One unreadable doc fails the whole link.
5. No ids at all answers 422 "Nenhum Google Docs encontrado nesse arquivo."
6. `parseFormTitle` splits each title and the table lookup sets `listed`.

`parseFormTitle` removes a trailing `.docx`, collapses whitespace and matches `IN <n> - Anexo <letters> - <name>`, case-insensitive, with `-` or `–` as the separator. The annex is upper-cased and later dashes stay in the name. Any other shape gives `normative: null`, `annex: null` and the whole title as the name.

### Saving

`POST /api/admin/forms` upserts by `google_doc_id` and always sets `active: true`, so saving a form already listed overwrites its IN, annex and name and reactivates it. The trigger records `updated_at` and `updated_by`.

### Editing a form

`PATCH /api/admin/forms/:docId` changes only the fields it receives. A new `googleDocId` must answer on Google first, otherwise 502 with the same message as resolving a link; if another row has it, 409 "Esse documento já está em outro formulário do catálogo." The primary key itself changes, so nothing should reference `google_doc_id` without `on update cascade`.

### Site check

`readCbmscSite` runs once a day, in the 09:00 UTC hour, through `client/vercel.json`, and whenever an admin presses "Verificar agora".

1. Fetch `CBMSC_FORMS_PAGE` and collect its Drive file ids. A failed fetch or no ids at all → `failed`.
2. Read each Drive PDF and each Google Doc title, as in Resolving a link, except that one failure does not stop the rest. Each failure adds to `failures` and makes the check `partial`. No form read at all → `failed`.
3. Replace the stored row. A later check overwrites it, including a failed one.

`diffSiteCheck` (`features/admin/lib/site-check.ts`) compares the stored row to the current catalog when the console reads them, so a warning disappears as soon as the admin applies it, with no extra state:

| Kind (screen title)                 | Condition                                                                                                         | Action                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `link_changed` ("Link mudou")       | Site id not in the catalog, and exactly one active form has the same IN and annex and an id no longer on the site | "Trocar link" patches `googleDocId`                                                         |
| `details_changed` ("Dados mudaram") | Same id on an active form, with a different name, IN or annex; skipped when the site title is off-pattern         | "Atualizar" patches those fields                                                            |
| `new` ("Novo anexo")                | Site id not in the catalog, and not a changed link (zero or several candidates)                                   | "Adicionar" saves it; none when the title is off-pattern, so the admin uses the import card |
| `removed` ("Saiu do site")          | Active form whose id is not on the site and was not matched as a changed link; `complete` checks only             | "Desativar" patches `active: false`                                                         |

| Status     | Warnings shown                     | Reason                        |
| ---------- | ---------------------------------- | ----------------------------- |
| `complete` | All kinds                          | —                             |
| `partial`  | All except `removed`               | An absence proves nothing     |
| `failed`   | None; the tab warns of the failure | The site's content is unknown |

Inactive forms never warn. The check does not guess: when two active forms share an IN and annex, or two site docs could replace the same form, those docs are `new` and those forms are `removed`.

### Ordering and search

`compareForms`: IN number numerically, then annex length (single letters before two letters), then annex alphabetically, then name in `pt-BR` order. `groupByNormative` applies it and groups by IN.

`filterForms` (`features/documents/lib/cbmsc-forms.ts`) keeps forms whose text `IN <n> Anexo <letter> <name>` contains every word of the query as a substring, ignoring accents and case. A blank query keeps everything.

### Dialog on `/documents`

`TemplatePicker` shows `CbmscFormsCard` after the template entries when `isSupabaseConfigured()`; otherwise it shows the non-clickable dashed "Anexos do CBMSC em breve" card. The dialog content mounts when opened, so `useCbmscForms` fetches the list on each opening and search and selection reset when it closes.

| Width       | Layout                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| `lg` and up | List (320px) and preview side by side; an empty state until a form is selected             |
| Below `lg`  | The list alone; selecting a form shows the preview alone, with "Voltar à lista" to go back |

`CbmscFormPreview` is keyed by doc id, so selecting another form resets its "Carregando a versão atual…" state. "Baixar .docx atualizado" links to the export URL in the same tab (Google answers with an attachment, so the page stays) and "Abrir no Google Docs" opens the edit URL in a new tab.

### Tab on `/admin`

See "Formulários CBMSC" in `client/features/admin/docs/admin-console.md`.

## What this does NOT do

- No filling of these forms. The documents chat only works with the `{{tag}}` templates in `public/templates/`; official docs have no tags, only `____`, `( )` and empty table cells.
- No automatic change to the catalog: the site check only warns, and a new annex appears only after an admin adds it.
- No detection of changes inside a doc, and no history of versions. The site check compares links, IN, annex and name, so it does not notice when the CBMSC edits a form's text.
- No e-mail or notification: the warning appears only on `/admin`.
- No delete. Removing a row needs SQL; there is no delete policy.
- The catalog list edits only a form's link and active state. Pasting its link in the import card and saving also rewrites IN, annex and name.
- The normative PDFs at the top of the CBMSC page are not catalogued.

## Gotchas

- **"Não foi possível ler esse link no Google"** → the doc is not public, Google timed out, the Drive file is not a PDF, or one of the PDF's docs is unreadable. → The server log has the specific error ("Failed to read a form link from Google").
- **The preview is blank and the console has a CSP error** → `frame-src` in `client/next.config.ts` lacks `https://docs.google.com`. → See `client/docs/security-headers.md`.
- **An admin sees an inactive form through a direct query but not in the dialog** → the admin policy returns every row, so `/api/documents/forms` filters `active` explicitly; do not remove that filter thinking RLS covers it.
- **Searching "in 1" also lists IN 10 and IN 15** → words match as substrings. Deliberate: it keeps partial typing useful.
- **An imported form has empty IN and Anexo** → its Google Doc title does not follow "IN n - Anexo X - name". → Type them before saving; "Salvar" reports the missing fields by form name.
- **A form always shows "Saiu do site"** → it was added by pasting a Google Docs link that is not listed under "Anexos de INs em vigor", so every complete check misses it, and warnings cannot be dismissed. → Deactivate it if it should not be in the catalog; otherwise the warning stays.
- **The daily check never runs in production** → `CRON_SECRET` is not set in Vercel, so the route answers 503, or `client/vercel.json` is outside the project's Root Directory. → Set the variable, confirm the job under Vercel → Settings → Cron Jobs, and redeploy.
- **The tab says "Verificação do site falhou"** → the CBMSC page could not be read, moved its links, or refuses Vercel's IPs. → The server log has "The CBMSC site check failed"; "Verificar agora" from another environment tells whether it is the IP.
- **The panel shows "Failed to load the site check"** → `20261105000100_cbmsc_site_check.sql` was not applied. The catalog keeps working.
- **A URI containing `)` is not found in a PDF** → `extractGoogleDocIds` reads `/URI (...)` up to the first `)`. Google Docs links do not contain it.
- **The "Formulários CBMSC" tab summary stays on "Carregando…" on `/admin`** → the list failed to load, usually because the migration was not applied; the summary only changes once the list arrives, and the error appears inside the tab. → Apply the migration.

## Setup

1. Apply `supabase/migrations/20261105000000_cbmsc_forms.sql`, which creates the table and seeds the 28 forms published under "Anexos de INs em vigor", then `supabase/migrations/20261105000100_cbmsc_site_check.sql`. Google's URLs are public and take no key.
2. For the daily check, set `CRON_SECRET` (a random string) and `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Vercel sends the secret as the bearer token by itself. "Verificar agora" needs neither.
