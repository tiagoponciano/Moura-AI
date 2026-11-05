# CBMSC form templates

How an official CBMSC form becomes fillable by the assistant now: the tagged copy, the button in the "Anexos do CBMSC" dialog and the check against the live document. For developers preparing another form. The catalog itself is in `client/docs/cbmsc-forms-catalog.md`; the chat and document generation are in `document-filling.md`.

## What this is

Official forms have no `{{tags}}`, only `____`, `( )` and empty table cells, so the assistant works from a reviewed copy in `public/templates/cbmsc/` with tags in the blanks. Each copy is an ordinary template in `public/templates/index.json`, with an extra `cbmsc` object naming the form it came from. Its fields are hand-written per form, so the code never guesses which blank is which.

Invariants:

- **Prepared forms are a list in code.** `FORMS` in `client/scripts/prepare-cbmsc-templates.mjs` holds each form's steps. Every other form shows the button disabled.
- **A copy is tied to the text it was made from.** `cbmsc.sourceTextHash` is compared to the live Google Doc when the form opens, and a different text blocks the assistant until the copy is regenerated and reviewed.
- **A template is found by IN and annex, not by Google Doc id,** so replacing a form's link in the catalog keeps its template.

## Surface

| Method | Path                                  | Who      | Returns                                                                                          |
| ------ | ------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `GET`  | `/api/documents/forms/:docId/version` | approved | 200 `{ textHash }`; 404 for a malformed id; 502 when Google cannot be read; 503 without Supabase |

| Export                                  | File                          | Contract                                                       |
| --------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `docxTextHash(docx)`                    | `lib/cbmsc-forms/doc-text.ts` | SHA-256 hex of the body text; see Rules                        |
| `fetchGoogleDocTextHash(id)`            | `lib/cbmsc-forms/google.ts`   | Server-only. Hash of the current export; throws on any failure |
| `findFormTemplate(templates, form)`     | `lib/cbmsc-forms.ts`          | The entry with the form's IN and annex, or `undefined`         |
| `assistantState(template, currentHash)` | `lib/cbmsc-forms.ts`          | See the table below                                            |
| `toDocumentText(schema, values)`        | `lib/form-values.ts`          | The text each tag receives                                     |

## Data shapes

```jsonc
// index.json entry of a prepared form
{
  "id": "in-1-anexo-d",
  "name": "IN 1 – Anexo D – Consulta técnica",
  "type": "docx",
  "file": "/templates/cbmsc/in-1-anexo-d.docx",
  "schema": "/templates/cbmsc/in-1-anexo-d.schema.json",
  "cbmsc": {
    "normative": 1,            // the IN number
    "annex": "D",
    "sourceTextHash": "9172…"  // docxTextHash of the official form, 64 hex characters
  }
}

// schema field for a ( ) option
{ "name": "has_re", "type": "boolean", "label": "Tem RE", "description": "…", "mark": true }
```

## Rules and behavior

### The button

`CbmscFormPreview` shows it for every form. Choosing it selects the template, which replaces the gallery and its dialog with the chat and field panel.

| State         | Condition                         | Button                               | Note under the actions                           |
| ------------- | --------------------------------- | ------------------------------------ | ------------------------------------------------ |
| `unavailable` | No template for this IN and annex | Disabled, "Assistente em preparação" | —                                                |
| `checking`    | Version request in flight         | Disabled, "Conferindo a versão…"     | —                                                |
| `ready`       | Live hash equals `sourceTextHash` | "Preencher com o assistente"         | —                                                |
| `outdated`    | Live hash differs                 | Disabled, "Modelo em revisão"        | "O CBMSC alterou este formulário…"               |
| `unverified`  | Version request failed            | "Preencher com o assistente"         | "Não foi possível confirmar a versão no Google…" |

The version is requested once each time a prepared form is selected. `unverified` stays usable on purpose: a Google outage says nothing about the text, while `outdated` is a known change.

### Text hash

`docxTextHash` joins every `<w:t>` of `word/document.xml`, collapses whitespace, trims and hashes. So run splits, whitespace and formatting do not change it, while any word in the body does. Headers and footers are not included.

### What a mark prints

A field with `mark: true` prints `X` when true and nothing when false, so `( )` becomes `( X )`. Any other boolean prints `Sim` or `Não`.

### Generating a copy

`pnpm run prepare-cbmsc-templates` (from `client/`) downloads each form in `FORMS` and writes `<id>.docx`, `<id>.schema.json` and its `index.json` entry. It walks the text runs in order and applies each step at the next run its pattern matches, throwing when one matches nothing:

| Step helper or key | Finds                                     | Writes                                                        |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------- |
| `text(...)`        | A run holding only underscores            | `{{name}}  `, with spaces so the next label does not touch it |
| `mark(...)`        | The next `( )`                            | `( {{name}} )`                                                |
| `match`, `to`      | A custom pattern                          | A custom replacement                                          |
| `clearNextBlocks`  | The next N runs of underscores and spaces | Empties them, for a free-text block spanning several runs     |

A tagged run also loses its `w:color`, because blanks are drawn in light gray.

### Preparing another form

1. Add it to `FORMS`, reading its runs first: the blanks must be listed in document order, and blanks the CBMSC or a signature fills stay out.
2. Run the script, render the `.docx` with a value in every field, and look at every page. `template-files.test.ts` proves tags and fields match, not that a value landed in the right place.
3. Commit the `.docx`, the schema and `index.json` together.

## What this does NOT do

- Only IN 1 Anexo D and Anexo H are prepared. Tables with Sim/Não columns, such as IN 7 Anexo C, have no helper yet.
- No warning to admins when a copy goes stale: users see "Modelo em revisão", and the site check does not compare text.
- Option groups are independent booleans: nothing stops both `( ) externa` and `( ) interna` from being marked.
- The date and signature blocks stay blank, to be filled when signing.
- The red notice in the official header ("Essa versão do documento é de uso exclusivo do CBMSC…") stays in generated documents, because the copy changes only the blanks.
- A form's chat does not change the placeholder example in the composer, which still describes a property.

## Gotchas

- **A value prints over the signature line** → a multi-line blank block is one run with spaces, which `text(...)` does not match, so the step moved on to the next plain blank. → Use `match: BLANK_BLOCK` with `clearNextBlocks`.
- **The button stays on "Modelo em revisão"** → the CBMSC edited the form. → Rerun the script, compare the new copy with the form and review it. A step that no longer matches makes the script throw.
- **`POST /api/documents/chat` answers 400 after adding a key to a schema field** → `templateField` in `lib/chat-request.ts` is a strict object. → Add the key there too.
