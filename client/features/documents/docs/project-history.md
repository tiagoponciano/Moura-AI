# Project history

How changes to a project are recorded and shown. Describes the code as it is now.

## What this is

Every change to a project's name or shared data (`project-fields.md`) is written to a log with the field, the old and the new value, who changed it and when. The "Dados do projeto" view ends with a toggle, "Histórico de alterações", that lists the latest changes. The log is written by the database, not by the app, so no path around the screen can skip it.

Invariants:

- Only a trigger writes the log; approved users can read it and nobody can insert, update or delete a row through the API.
- One row per field that changed in an update, so editing three fields in one save logs three rows.
- The author's name is copied into the row, because profiles are readable only by their owner.

## Surface

| Method | Path                                  | Returns                                                                                                      | Errors                                                           |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `GET`  | `/api/documents/projects/:id/history` | `{ changes: [{ id, field, old_value, new_value, changed_by_name, changed_at }] }`, newest first, at most 100 | 400 invalid project id, 500 `Failed to load the project history` |

Table `project_changes` (`20261112000000_project_history.sql`) and the trigger `projects_log_changes`, which runs after an update of a project when its `name` or its `data` changed.

## Rules and behavior

1. A new `name` logs a row with `field = 'name'`.
2. Each key of `data` whose value differs between the old and the new data logs a row with the key as `field`; a key that appears logs `old_value = null`, a key that is removed logs `new_value = null`.
3. The screen writes each row on one line: filled (`preenchido com “…”`), cleared (`apagado (era “…”)`) or `“old” → “new”`, with the field's label (group and field for shared data, "Nome do projeto" for the name), and under it the author and the time.
4. The list loads each time the toggle opens, so it shows changes made since.
5. Archiving a project (`archived_at`) is not logged.

## What this does NOT do

- It does not record changes to a form's own values (`form-fillings.md`), only the project's shared data and name.
- It does not undo or restore anything.
- The list stops at the latest 100 changes; older rows stay in the table.
- A change made with no signed-in user (for example from the SQL editor) is logged with no author name.
- Rows of a deleted project are deleted with it.

## Gotchas

- The history is empty after applying the migration → only changes made after the trigger exists are logged → nothing to do for earlier edits.
- "Alguém" shows as the author → the profile of the user has no name and no email, or the change came without a session → expected for edits outside the app.
