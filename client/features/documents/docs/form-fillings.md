# Form fillings

How what was filled in each form of a project is saved and reopened. Describes the code as it is now.

## What this is

Each project keeps one saved filling per form: the values of that form's fields. Opening the same form in the same project loads them again, and the home of the documents page lists the forms already started. Without a project, nothing is saved.

Invariants:

- One filling per `(project, template)`; saving replaces the whole `values` object.
- Fillings are shared by every approved user, like projects. There is no delete.
- The shared project data (`project-fields.md`) is separate: fields tied to a project key are also written to the project, and saved values of the form are applied on top of the project prefill.

## Surface

| Method | Path                                               | Returns                                                             | Errors                                                    |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `GET`  | `/api/documents/projects/:id/fillings`             | `{ fillings: [{ template_id, values, updated_at }] }`, newest first | 400 invalid project id, 500 `Failed to load the fillings` |
| `PUT`  | `/api/documents/projects/:id/fillings/:templateId` | `204`; body `{ values }`                                            | 400 invalid ids or body, 500 `Failed to save the filling` |

Table `form_fillings` (`20261110000000_form_fillings.sql`): primary key `(project_id, template_id)`, `values jsonb` (an object), `updated_by` and `updated_at` set by a trigger on every write. RLS: approved users read, insert and update.

## Rules and behavior

1. Choosing a form under a project loads its saved values together with the schema. The result is the project prefill, then the saved values for fields that exist in the schema and are not empty.
2. Saved fields show the "editado" tag; project prefilled ones keep "projeto".
3. The values are saved when the assistant fills fields (at once) and 800 ms after the last edit in the panel.
4. A form with no value filled is not saved, so opening a form and leaving does not list it as started.
5. The home lists the project's saved forms whose template still exists, newest first; choosing one opens it.
6. A failed save shows the error in the panel's notice area; the values stay on screen.

## On the project page

The project page (`/projects/[id]`) has a "Documentos" card (`ProjectDocumentsSummary`, with `useProjectDocuments`). It loads the fillings, the template index and the project's files (`project-files.md`) and joins them with `projectDocuments` (`lib/project-documents.ts`):

1. The forms are the started ones, as on the home of the documents page (`startedForms`): newest edit first, removed templates left out. Each shows "Editado em <date>".
2. A `form` file belongs to the template whose id its name starts with, followed by `.` or `_` (`documentFileName` names it `<id>.docx` or `<id>_<company>.docx`). When several ids match, the longest wins. A form shows a download button for its latest file, or "Documento não gerado".
3. "Proposta comercial" shows the latest `proposal` file, with "Gerada em <date>", when there is one.
4. With no started form and no proposal the card says "Nenhum formulário começado."

"Abrir" goes to `/documents`, on its home.

## What this does NOT do

- No history of changes: only the last saved values and who/when.
- Two people editing the same form at once overwrite each other; the last save wins.
- Values for a field that left the schema are kept in the table and ignored on load.
- A removed or renamed template stays in the table and disappears from the list.

## Gotchas

- Saved values do not appear → the form was opened with no project selected → pick a project in the dialog before choosing the form.
- A generated `.docx` does not show on the project page → the form has no saved filling, so it is not a started form → the card lists documents only under the forms that were filled.
- A boolean left untouched is not saved as `false` → the panel shows "Não" for unset switches → the saved values only hold what was set.
