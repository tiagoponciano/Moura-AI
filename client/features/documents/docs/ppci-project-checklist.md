# PPCI checklist per project

How a project answers Moura's PPCI checklist. Describes the code as it is now. How the checklist itself is imported is in `client/docs/ppci-checklist.md`.

## What this is

In the documents dialog, the "Checklist PPCI" button shows the newest imported checklist for the selected project: a control panel like the one in Moura's sheet, and one toggle per group with its items. Each item takes one of three answers and a free note. Answers belong to the project and the checklist version, and keep who answered and when.

Invariants:

- One answer per `(project, checklist version, group, item)`; saving replaces it.
- Answers are shared by every approved user. There is no delete; clearing sets the status back to empty.
- The checklist shown is the version with the newest `created_at`; answers of older versions stay in the table and are not shown.

## Surface

| Method | Path                               | Returns                                                              | Errors                                                                                  |
| ------ | ---------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET`  | `/api/documents/projects/:id/ppci` | `{ version, groups: [{ position, name, items }], answers }`          | 400 invalid project id, 404 `No checklist imported`, 500 `Failed to load the checklist` |
| `PUT`  | `/api/documents/projects/:id/ppci` | `204`; body `{ version, groupPosition, itemPosition, status, note }` | 400 invalid id or body, 500 `Failed to save the answer`                                 |

`status` is `atende`, `adequar`, `na` or `null`; `note` is text up to 2000 characters or `null`. Table `ppci_answers` (`20261111000000_ppci_answers.sql`) has a trigger that sets `updated_at`, `updated_by` and `updated_by_name` on every write; the name is copied because profiles are readable only by their owner.

## Rules and behavior

Control panel, per group (same columns as the sheet):

| Column        | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Itens         | Number of items in the group                                     |
| Concluídos    | Items answered Atende                                            |
| Não se aplica | Items answered Não se aplica                                     |
| Pendentes     | Items − Concluídos − Não se aplica (not answered, or Adequar)    |
| Progresso     | Concluídos ÷ (Itens − Não se aplica), rounded to a whole percent |

Progress is 100% when every item does not apply, and 0% in a group with no items.

Pressing the active status button clears it. A note is saved when the field loses focus and only if it changed. Each change shows at once and is restored with an error message if saving fails. Under an item that has a status or note, the name of who answered last and the time are shown.

## What this does NOT do

- "Adequar" does not count as concluded; it keeps the item pending.
- No history of earlier answers, and no per-item report yet.
- Two people answering the same item at once overwrite each other.
- The name shown is the one of the last writer, not of each field.

## Gotchas

- "No checklist imported" → the seed migrations were not applied → apply `20261109000000` and `20261109000100`.
- Answers vanish after a new checklist version is imported → the screen shows the newest version and answers are per version → answers of the old version are still in `ppci_answers`.
