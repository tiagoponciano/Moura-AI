# Project files

How a project keeps its files: the table, the bucket and the three routes. For developers adding what is stored, or changing where it is shown.

## What this is

A project keeps what was generated for it (forms, the proposal, converted plans) and what was uploaded (a plan). The file itself lives in the private Supabase Storage bucket `project-files`, under `<project_id>/`; a row of `project_files` records its name, kind, type, size and path. The browser uploads straight to the bucket, as the chat attachments do, so no file passes through a Vercel function; the app then records the row through the API. Both come from `supabase/migrations/20261119000000_project_files.sql`, which must be applied before the routes work.

Invariants:

- **A row's path starts with its project's id.** The table checks it (`storage_path`), and the record route refuses any other path, so a row cannot point into another project's folder.
- **Shared by every approved user, like projects.** The table and the bucket have policies for read, insert and delete for approved users; there is no update, because a file is added or removed, not changed.
- **Deleting removes the object first.** If the object cannot be removed the row stays, so a listed file always has its object; the reverse (an object with no row) can only come from an upload that was never recorded.
- **Size is limited to 25 MB** by the bucket and by `PROJECT_FILE_MAX_BYTES` in `lib/projects/files.ts`; keep them in sync.

## Surface

| Method   | Path                                | Takes                                                  | Returns                                                 |
| -------- | ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| `GET`    | `/api/projects/[id]/files`          | none                                                   | `{ files }`, newest first, at most 100                  |
| `POST`   | `/api/projects/[id]/files`          | `{ kind, fileName, mimeType, sizeBytes, storagePath }` | `{ file }` with 201; 400 for a path outside the project |
| `DELETE` | `/api/projects/[id]/files/[fileId]` | none                                                   | 204; 404 when the project has no such file              |

`kind` is `form`, `proposal`, `plan`, `conversion`, `classification` or `other`. Errors are `{ error }`: 400 invalid id or body, 500 when the table or the bucket cannot be used (as before the migration is applied).

| Export                                                                         | File                                        | Contract                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------- |
| `buildProjectFilePath(projectId, fileName, id)`                                | `lib/projects/files.ts`                     | `<projectId>/<id>-<safe name>`: no accents, spaces, slashes or leading dots |
| `checkProjectFile(sizeBytes)`                                                  | `lib/projects/files.ts`                     | `"empty"`, `"too_large"` or `undefined`                                     |
| `projectFileRecordBody`                                                        | `lib/projects/files.ts`                     | The body of the record route; unknown keys are refused                      |
| `handleListProjectFiles`, `handleRecordProjectFile`, `handleDeleteProjectFile` | `features/projects/server/files-handler.ts` | The three route handlers                                                    |

## The screen

The project page (`/projects/[id]`) has an "Arquivos" section (`ProjectFilesList`) under the module cards, listing every file kept for the project with its kind and date and a download button. Toggles above the list filter by kind, each with its count (`FILE_FILTERS`, `filterFiles`, `countByFilter` in `features/projects/lib/file-filters.ts`): Todos, Documentos (`form`), Propostas (`proposal`), Classificação (`classification`), Plantas (`plan` and `conversion`) and Outros (`other`). Classificação shows the `classification` files. A search box beside them narrows the list by words of the file name, ignoring accents and case (`searchFiles`). Besides that list, the project page (`/projects/[id]`) shows each file inside the card of the module that generated it (`projects-module.md`): the documents card matches `form` files to the forms and shows the latest `proposal`; the plans card matches `plan` and `conversion` files to the conversions. Each file has only a download button (`ProjectFileButton`). `useProjectFiles` (`hooks/use-project-files.ts`) loads the list and downloads through a signed URL for the object, valid for a minute, made with the signed-in user's own session (`projectFileUrl`).

`lib/projects/files-client.ts` uploads to the project's folder and records the row, and removes the object again if recording fails, so nothing is stored without a row.

## What is kept on its own

When a project is chosen, three places keep what they generate, after the download has been made, with `keepProjectFile` (it never throws; it resolves to whether the file was kept):

- **Documentos**: the `.docx` of a form, as `form`. A failure shows "O documento foi baixado, mas não foi guardado no projeto." in the panel notice.
- **Proposta**: the `.pptx` (and the PDF, when PDF output is on), as `proposal`. A failure shows a short note under the buttons.
- **Plantas**: the DXF or DWG, as `conversion`, and the plan that was uploaded, as `plan`, once per plan and project in a session (converting to DXF and then to DWG keeps the plan once). A failure replaces the line above the panel.

Without a chosen project nothing is kept, and the download is the same as before.

## File names

With a project chosen, what the app generates is named after the project, in `<file's own name> - <project>.<extension>` (`nameWithProject` in `lib/projects/file-name.ts`): the form `.docx` and PDF keep the title the server gives them (`Anexo C - Loja Centro.docx`), the proposal is `Proposta - Loja Centro.pptx`, and a converted plan is `Térreo - Loja Centro.dxf`, from the uploaded plan's name. The same name is used for the download and for the copy kept in the project. Characters a file name cannot hold become a space, and a long project name is cut before the file's own. Without a project the names are what they were.

## What this does NOT do

- **Only the browser keeps files.** What the app generates is kept by the screen that generated it, once the download has been made; nothing generated on the server alone is kept.
- **No download route.** The browser makes a signed URL for the object with its own session, which the bucket's read policy allows.
- **No upload or delete on screen.** Nothing in the app records an `other` file or calls the delete route; both stay in the API. An `other` file recorded through the API is not shown anywhere.
- **No quota or retention.** Nothing limits how many files a project has beyond the list showing 100.
