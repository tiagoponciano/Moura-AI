# Projects module

How the Projetos area works now: the list of the team's projects and the page of one project. For developers changing either, or adding what a module shows on the project page.

## What this is

`/projects` lists the projects, searchable by name, city or occupation and sortable by column, ten to a page, with a button to create one. `/projects/[id]` shows one project: its name with a line of city, occupation and area and a menu to rename or archive it (archiving goes back to the list), one card per module with what that module holds for the project (Classificação, Documentos, Plantas), and then the project's data grouped as in the project panel of the documents module. A project is the same record the documents module uses (`/api/documents/projects`); this module adds no table, and its only route handlers are the project files ones (`project-files.md`).

Invariants:

- **Looking at a project chooses it.** `ProjectDetail` writes the id with `writeSelectedProject`, so the "Abrir" button of each card opens the module on that project.
- **Each module draws its own card.** The cards come from the modules (`ProjectClassificationSummary`, `ProjectDocumentsSummary`, `ProjectFloorPlansSummary`), each exported from the module's `index.ts`. `app/(app)/projects/[id]/page.tsx` puts them inside `ProjectDetail` as children, because a feature never imports another feature.
- **Without Supabase there is nothing to list.** The page says projects need Supabase, like the other modules that depend on it.
- **The data is edited in dialogs.** The page has two tabs: "Resumo" (what each module holds, then the files) and "Dados do projeto", a table with one row per group of fields (the property, its owner, the engineer, the block and building, the accountant, the applicant) showing how many fields are filled and a pencil. The pencil opens the group's fields in a dialog; nothing is saved until "Salvar", which sends only the fields that differ (`groupChange`), a blank one removing its key, through `useProjects().saveData`; "Cancelar" discards the draft. The same fields feed the forms and the proposal of the project. A failed save shows the error under the tabs.

## Surface

| Path             | What it renders                                                        |
| ---------------- | ---------------------------------------------------------------------- |
| `/projects`      | `ProjectsWorkspace`: table, "Novo projeto"                             |
| `/projects/[id]` | `ProjectDetail` with the three module cards as children, then its data |

The sidebar shows "Projetos" under "Início", outside the module list (`PROJECTS_PATH` in `lib/modules.ts`), so the home page cards do not change.

| File                                | Holds                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `lib/project-summary.ts`            | `summarizeProject` (city, occupation, area from the project data), `formatArea`     |
| `components/projects-workspace.tsx` | The list page: empty and loading states, the new-project dialog                     |
| `components/projects-table.tsx`     | The TanStack table: search box, sortable headers, pages of ten (`useTable`)         |
| `components/projects-columns.tsx`   | Projeto (with its city), Ocupação and Área; each sorts on click                     |
| `lib/projects-table.ts`             | Table features, area parsing, search match, sort functions and the page range       |
| `components/project-detail.tsx`     | The project page: header, the cards it is given, the project data                   |
| `components/project-data-form.tsx`  | The editable groups of the project data; `fieldChange` decides what a field changes |

The field groups and labels come from `lib/projects/fields.ts`, shared with the documents module. `useProjects` exposes `loaded`, true once the first list or error has come, so the page tells "still loading" from "no projects". The cards are rendered only once the project is found.

## The module cards

Every card is a `ModuleSummaryCard` (`components/shared/module-summary-card.tsx`): a title, the module's icon and an "Abrir" link to the module's page. Each loads its own data for the project, shows a skeleton while it loads and the error of its own request when one fails, so one module failing does not hide the others. Files are downloaded with `ProjectFileButton` (`components/shared/project-file-button.tsx`) through `useProjectFiles` (`hooks/use-project-files.ts`), which makes a signed link valid for a minute.

| Card          | What it shows                                                                                       | Described in                                    |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Classificação | Risk with process and source, answers given out of the total, what is missing, the required systems | `classification/docs/project-classification.md` |
| Documentos    | Each form started, its last edit, the latest `.docx` generated for it; the latest proposal          | `documents/docs/form-fillings.md`               |
| Plantas       | Each conversion (name, format, mode, scale, date) with the plan sent and the file produced          | `floor-plans/docs/floor-plan-conversion.md`     |

## What this does NOT do

- **The tools are not inside the project.** "Abrir" goes to the module's own page, which opens on the chosen project; there are no `/projects/[id]/<module>` routes. It cannot open one specific form either: the documents page opens on its home.
- **No upload or delete on the page.** The project keeps only what the modules generate (`project-files.md`).
- **A blank sorts first.** A project with no occupation or area sorts before the others when ascending, so last when descending.
- **No dates or risk in the list.** A project has no update date, and the risk is not stored with it; the table shows the city, occupation and area it knows.
- **No rename or archive here.** Those stay in the documents module.

## Gotchas

- A new module card does not show → it was exported from the module but not added to `app/(app)/projects/[id]/page.tsx` → add it there as a child of `ProjectDetail`.
- The documents and plans cards each ask for the project's files → two `GET /api/projects/[id]/files` per page load is expected, one per card.
