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

## What this does NOT do

- **It is not applied by itself.** The migration `20261116000000_project_classifications.sql` has to be applied to Supabase; until then both routes answer 500.
- **The screen does not use it yet.** Loading and saving from the Classification tab come next.
- **It keeps no history.** Each save replaces the previous state.
