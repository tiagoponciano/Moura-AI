# Project fields

How a project remembers data across forms now: which fields it shares, how a form is filled from it and how it is updated. For developers preparing forms or adding shared fields.

## What this is

A project is a job the team works on. It keeps the data that repeats across official forms: people register it in the "Dados do projeto" area of the forms dialog, so opening a form with a project chosen fills those fields at once, and whatever the assistant or the user fills in one form is there in the next. The mapping lives in each template's schema (`projectKey`), written by hand per form, because labels alone are ambiguous: "Nome" can be the requester, the owner or the engineer.

Invariants:

- **The assistant still only fills fields.** It sees the filled values in its prompt so it does not ask again, and it never reads or writes a project directly.
- **Only the project's own area can erase data.** Clearing a field in a form leaves the project as it was; clearing it in "Dados do projeto" removes it.
- **A project is optional.** With none chosen, forms start empty and nothing is saved.

## Surface

| Method  | Path                          | Body       | Success                     | Errors                                                                                                                       |
| ------- | ----------------------------- | ---------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `GET`   | `/api/documents/projects`     | —          | 200 `{ projects }`, by name | 401, 403, 503, 500 `Failed to load projects`                                                                                 |
| `POST`  | `/api/documents/projects`     | `{ name }` | 201 `{ project }`           | 400, 401, 403, 503, 500 `Failed to create the project`                                                                       |
| `PATCH` | `/api/documents/projects/:id` | `{ data }` | 204                         | 400 (unknown key, blank or over 2000 characters), 401, 403, 404 `Project not found`, 503, 500 `Failed to update the project` |

Database: `20261105000200_projects.sql` and `20261105000300_project_data.sql`. Approved users read, add and update every project; nobody deletes.

| Export                                                                 | File                             | Contract                                                 |
| ---------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| `PROJECT_FIELD_GROUPS`, `PROJECT_FIELD_KEYS`, `isProjectFieldKey(key)` | `lib/project-fields.ts`          | The shared keys and how the panel groups and labels them |
| `mergeProjectData(data, change)`                                       | `client/lib/projects/project.ts` | Applies a change; `null` removes a key                   |
| `fieldChange(key, value, data)`, `groupProgress(group, data)`          | `lib/project-fields.ts`          | The change from one edited field; a group's filled count |
| `valuesFromProject(schema, data)`                                      | `lib/project-fields.ts`          | The form values a project already knows                  |
| `changedProjectData(schema, values, data)`                             | `lib/project-fields.ts`          | Trimmed shared values that differ from the project       |

## Data shapes

```jsonc
// Project, in { projects } and { project }
{
  "id": "6f1c…",
  "name": "Padaria Silva",
  "data": { "owner_name": "João Silva", "property_city": "Florianópolis" }
                       // any subset of PROJECT_FIELD_KEYS; all values are strings
}

// PATCH /api/documents/projects/:id: the keys to merge; others stay
{ "data": { "property_city": "Palhoça", "property_re": null } } // null clears the key

// schema field tied to the project
{ "name": "requester_name", "type": "string", "label": "Nome do solicitante", "description": "…", "projectKey": "owner_name" }
```

The keys are the fields of `PROJECT_FIELD_GROUPS`, in three groups: property (`property_*`), owner (`owner_*`, also the requester) and engineer in charge (`technical_*`).

## Rules and behavior

### Dados do projeto

"Dados do projeto" in the project bar, enabled once a project is chosen, swaps the form list for one collapsible section per group, each showing `<filled> de <total>`. The first section starts open. Creating a project goes straight there. A field saves when it loses focus, only if its trimmed value changed. "Ver formulários" goes back.

### In the forms

| When                                          | What happens                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A form opens with a project chosen            | Its tied fields fill from the project, tagged "projeto" in the panel                                               |
| A chat message is sent                        | The filled values go in the request and into the prompt's "Already filled" list, limited to the schema's fields    |
| The assistant fills fields                    | Changed shared values are saved at once                                                                            |
| The user types in the panel                   | Changed shared values are saved 800 ms after the last keystroke; leaving the form within that pause drops the save |
| Prefilled values complete the required fields | No PDF yet: it waits for an assistant result or "Gerar PDF"                                                        |

The requester of IN 1 Anexo D is treated as the property owner. `building_cpf` of Anexo D has no key, because the form separates CPF and CNPJ and the owner's document can be either. A save updates the screen first; a server failure appears in the project bar when the dialog next shows. `PATCH` reads and then writes, so two people saving the same project at once keep the last write of each key they both sent.

To tie a new form, add its `projectKeys` in `client/scripts/prepare-cbmsc-templates.mjs` and rerun it. `template-files.test.ts` fails on a key outside `PROJECT_FIELD_KEYS` or used twice in one schema.

## What this does NOT do

- Event (IN 24, 27) and company (IN 28) data are not shared: only property, owner and engineer.
- No way to rename or delete a project.
- Numbers, dates and options are not shared; only string fields can have a key.
- No history of who changed a project.

## Gotchas

- **The project list says "Failed to load projects" after deploying** → `20261105000300_project_data.sql` was not applied, and the list selects `data`. → Apply it. The forms keep working.
- **A value from one form overwrites another's in the project** → both fields share a key on purpose, and the last save wins. → Tie them to different keys if they are different things.
