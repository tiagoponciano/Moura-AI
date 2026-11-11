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

## Pending-items report

`GET /api/documents/projects/:id/ppci/report` returns `pendencias-ppci.pdf`, the report for the drafter. The "Relatório de pendências (PDF)" button in the checklist downloads it.

- Content: a header with the project name, the technical lead (`technical_name` and `technical_registry` of the project data, when filled) and the date in São Paulo time, then each group with at least one item answered Adequar, in checklist order, with the item's sub-heading and note. Groups with none are left out; with none at all the page says "Nenhum item a adequar."
- It is built as an HTML page by `reportHtml` (all project text escaped) and printed to PDF by the PDF microservice's Chromium route. No model takes part.
- Errors: 400 invalid project id, 404 `Project not found` or no checklist imported, 503 when `PDF_SERVICE_URL` is not set, 502 when the PDF service fails.
- Items answered Atende or Não se aplica, and items never answered, are not in the report.

## Checklist agent

Above the control panel, "Conversar com o agente" goes through the checklist with the user, one group at a time, and records the answers through tools. The model never decides an answer: it extracts what the user said, and code applies it.

- **Current group:** the group picked in the selector, else the first group with an unanswered item, else the last group. Answering the last item of a group moves the conversation to the next one on its own.
- **What the model receives:** `POST /api/documents/ppci-chat` takes `{ id, messages, projectId, groupPosition }`. The server loads the checklist and the project's answers itself, and the system prompt (`buildPpciInstructions`) lists only the current group's unanswered items, with their numbers. Items already answered and other groups are not sent.
- **Tools:** `mark_items` takes `{ items: [{ position, status, note? }] }`; `mark_group_not_applicable` takes nothing and stands for "Não se aplica" on every unanswered item of the group. Both only echo their input; the browser (`changesFromToolOutput`) drops items that are not in the current group and saves each answer like a click.
- **Suggestions:** the prompt tells the model to say anything it infers from the project as a suggestion and to wait for the user to confirm before recording it.
- **Whole groups that do not apply:** each group also has the button "Este grupo não se aplica ao projeto", which marks its unanswered items as Não se aplica, and "Desfazer os “Não se aplica”", which clears every Não se aplica in the group. Nothing is marked on its own when the checklist opens.

The conversation is not saved: closing the dialog or reloading clears it, while the recorded answers stay.
