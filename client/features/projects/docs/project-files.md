# Project files

How a project keeps its files: the table, the bucket and the three routes. For developers adding what is stored, or building the screen that lists it.

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

`kind` is `form`, `proposal`, `plan`, `conversion` or `other`. Errors are `{ error }`: 400 invalid id or body, 500 when the table or the bucket cannot be used (as before the migration is applied).

| Export                                                                         | File                                        | Contract                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------- |
| `buildProjectFilePath(projectId, fileName, id)`                                | `lib/projects/files.ts`                     | `<projectId>/<id>-<safe name>`: no accents, spaces, slashes or leading dots |
| `checkProjectFile(sizeBytes)`                                                  | `lib/projects/files.ts`                     | `"empty"`, `"too_large"` or `undefined`                                     |
| `projectFileRecordBody`                                                        | `lib/projects/files.ts`                     | The body of the record route; unknown keys are refused                      |
| `handleListProjectFiles`, `handleRecordProjectFile`, `handleDeleteProjectFile` | `features/projects/server/files-handler.ts` | The three route handlers                                                    |

## The screen

The project page (`/projects/[id]`) has an "Arquivos" section (`ProjectFiles`, with `useProjectFiles`). It lists the project's files with their origin, size and date; "Enviar arquivo" uploads one or more files as `other` (a failure is shown and the others still go); each row has download and delete. Download makes a signed URL for the object, valid for a minute, with the signed-in user's own session (`projectFileUrl`), and delete asks the route, which removes the object and then the row. `lib/projects/files-client.ts` uploads to the project's folder and records the row, and removes the object again if recording fails, so nothing is stored without a row.

## What this does NOT do

- **Nothing generates into it yet.** The files on the list are the ones a person uploaded; saving what the forms, the proposal and the conversions produce is the next step.
- **No download route.** The browser makes a signed URL for the object with its own session, which the bucket's read policy allows.
- **No quota or retention.** Nothing limits how many files a project has beyond the list showing 100.
- **Not tried against a real Supabase.** The handlers are tested with a mock client; the migration has not been applied.
