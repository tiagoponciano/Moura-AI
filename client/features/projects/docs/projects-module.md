# Projects module

How the Projetos area works now: the list of the team's projects and the page of one project. For developers changing either, or moving the tools inside the project.

## What this is

`/projects` lists the projects, searchable by name, with a button to create one. `/projects/[id]` shows one project: its name, the data it keeps grouped as in the project panel of the documents module, and a row of links to the tools that work on a project. A project is the same record the documents module uses (`/api/documents/projects`); this module adds no table and no route handler.

Invariants:

- **Looking at a project chooses it.** `ProjectDetail` writes the id with `writeSelectedProject`, so Documentos, Classificação and Plantas open on that project.
- **Without Supabase there is nothing to list.** The page says projects need Supabase, like the other modules that depend on it.
- **Only what a project knows is shown.** The page lists the fields it has a value for; an empty group shows no rows.

## Surface

| Path             | What it renders                                        |
| ---------------- | ------------------------------------------------------ |
| `/projects`      | `ProjectsWorkspace`: search, table, "Novo projeto"     |
| `/projects/[id]` | `ProjectDetail`: the project's data and links to tools |

The sidebar shows "Projetos" under "Início", outside the module list (`PROJECTS_PATH` in `lib/modules.ts`), so the home page cards do not change.

| File                                | Holds                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `lib/project-summary.ts`            | `summarizeProject` (city, occupation, area from the project data), `formatArea` |
| `components/projects-workspace.tsx` | The list page: search, empty and loading states, the new-project dialog         |
| `components/projects-table.tsx`     | One row per project                                                             |
| `components/project-detail.tsx`     | The project page                                                                |
| `components/project-sections.tsx`   | The links to Documentos, Classificação and Plantas                              |

The field groups and labels come from `lib/projects/fields.ts`, shared with the documents module. `useProjects` exposes `loaded`, true once the first list or error has come, so the page tells "still loading" from "no projects".

## What this does NOT do

- **The tools are not inside the project yet.** Documentos, Classificação and Plantas are links to their own pages, which open on the chosen project. Bringing them inside the project page, and the Arquivos section, are later steps.
- **No dates or risk in the list.** A project has no update date, and the risk is not stored with it; the table shows the city, occupation and area it knows.
- **No rename or archive here.** Those stay in the documents module.
