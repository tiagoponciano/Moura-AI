# Classification saved per project

How the inputs of a classification are kept for a project, so it reopens where it stopped. For developers working on the storage or on the screen that uses it. It describes the code as it is now; read `building-classification.md` first.

## What this is

A project can keep one classification: the answers, the occupations of a mixed building, the enlargement of an existing building and the construction faults of Annex D. Only the inputs are saved. The result (systems, reasons, questions) is computed again from them, so a change in the rules shows on the next load.

Invariants:

- **Inputs only.** `ClassificationState` (`lib/classification-state.ts`) holds `facts`, `parts`, `enlargement` and `faults`, never a `Classification`.
- **Checked on both sides.** `pickState` runs on write and on read, each part on its own (`pickFacts`, `pickParts`, `pickEnlargement`, `pickFaults`). An invalid part is dropped without losing the others, and what is stored never carries more than the panel itself accepts.
- **One row per project.** Whoever saves replaces the row; `updated_by` and `updated_at` come from a trigger.
- **Shared like projects.** Every approved user reads and writes; there is no delete policy, and the row goes with its project.

## Surface

| Export / route                                 | File                                         | Contract                                                                        |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `ClassificationState`, `pickState`, `hasState` | `lib/classification-state.ts`                | Pure; the shape, its validation and whether there is anything to keep           |
| `GET /api/classification/projects/[id]`        | `server/project-state-handler.ts`            | `{ state, updated_at }`, with `state: null` when nothing was saved              |
| `PUT /api/classification/projects/[id]`        | `server/project-state-handler.ts`            | `{ state }` → `204`; the state goes through `pickState` before it is stored     |
| `public.project_classifications`               | `20261116000000_project_classifications.sql` | `project_id` (primary key, cascades), `state jsonb`, `updated_by`, `updated_at` |

Errors are `{ error }`: 401 without a session, 503 without Supabase, 400 for an id that is not a uuid or a body with anything besides `state`, 500 when the table cannot be read or written.

## On the screen

The Classification tab shows the project picker (the same `ProjectPicker` and shared choice as Documents, see `document-filling.md`) and a status line above the chat and the panel. Without Supabase there is no picker and nothing is saved, as before.

- **Loading.** Choosing a project loads its state (`useProjectClassification`) and replaces what is on screen with it, or with an empty state when none was saved. The restored facts are tagged "projeto".
- **Saving.** Every change made by a tool result, a value typed in the panel or "Limpar respostas" goes through `useClassification`, which hands the whole new state to `persist`; the save goes out 800 ms after the last change. It is not driven by an effect watching the state, which would save the empty state before the load lands. Nothing is saved while the state loads or after a load or a save failed.
- **Changing project.** A pending save goes out at once, to the project it belongs to, before the other project loads; a late answer for the previous project is ignored.
- **When it is not available.** If the state cannot be read or saved (the migration not applied, no connection), the status line says so and the panel keeps working without saving.
- **The chat follows the project.** The request carries `projectId`, the chat is saved with `{ projectId }` as its context, the history lists only that project's chats, and choosing another project starts a new conversation. Reopening a saved chat replays its tool results over the project's state, which is the same state they came from.

## What this does NOT do

- **It is not applied by itself.** The migration `20261116000000_project_classifications.sql` has to be applied to Supabase; until then both routes answer 500.
- **It keeps no history.** Each save replaces the previous state.
