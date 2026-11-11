# Conversation steps

How the documents agent leads a form's conversation one step at a time: how the form is split into steps, which step is current, and what the agent is told. Describes the code as it is now, in `features/documents/lib/conversation-steps.ts`, `server/instructions.ts` and `hooks/use-document-filling.ts`.

## What this is

Every template has an ordered list of steps; each step is a group of field names the agent asks about together. Steps come from the form itself: either derived from the schema, or written by hand in a `<id>.guide.json` next to it.

Invariants:

- Every field of the schema is in exactly one step. Nothing is asked twice, nothing is skipped.
- Steps follow the order of the fields in the schema, which is the order of the document.
- A guide that fits the schema replaces the derived steps entirely; the two are never mixed.
- Code decides the current step from the filled values. The model only extracts values, or reports that the user said a step does not apply.

## Rules and behavior

`conversationSteps(schema, guide?)` returns `guide.steps` when a guide is passed and `guideProblems` finds nothing, otherwise `deriveSteps(schema)`. The fallback matters because the chat's schema comes from the browser and may not match the guide on disk.

`deriveSteps` walks the fields in order and starts a new step when:

| Next field    | Current step holds                      | Result                    |
| ------------- | --------------------------------------- | ------------------------- |
| a mark        | only marks, fewer than the limit        | joins the step            |
| a mark        | any plain field, or the limit           | starts a new step         |
| a plain field | only marks, fewer than the limit        | joins (it completes them) |
| a plain field | marks and a plain field, or the limit   | starts a new step         |
| a plain field | only plain fields, fewer than the limit | joins the step            |
| a plain field | only plain fields, at the limit         | starts a new step         |

Before those rules: a field whose label is numbered `N.M ` (as in the checklist forms, "1.12 Os chuveiros…") always starts a new step when the previous field belongs to another section (a different `N`, or none), so a checklist is asked section by section.

A mark is a field with `mark: true`, a `( )` option in the document. The limit is `MAX_STEP_FIELDS` (6). So `has_re` followed by `re_number` share a step, and a run of marks such as `external_query`, `internal_query` becomes one choice.

A guide is a JSON file referenced by the template's `guide` key in `public/templates/index.json`:

```json
{
  "steps": [
    {
      "fields": ["external_query", "internal_query"],
      "question": "A consulta é externa ou interna ao CBMSC?"
    }
  ]
}
```

`question` is optional, Portuguese, and is the wording the agent starts the step from. Guide steps may exceed the limit.

`guideProblems(schema, guide)` returns `Unknown field: <name>` and `Field in two steps: <name>` in the order the guide lists those fields, then `Field in no step: <name>` in schema order; an empty list means the guide is valid. `conversation-steps.test.ts` runs it over the steps of all 28 templates, so a guide that drifts from its schema fails the suite.

### Current step

`stepProgress(schema, steps, values, skipped)` returns `{ index, total, step, next }`. A step is done when its position is in `skipped`, or when at least one of its fields has a value and every required field in it that is not a boolean is filled. `false` counts as a value, so answering "não" to a mark completes its step. `index` is the first step not done (`total` when all are); `next` is the one after it that is not done.

| Case                                             | Step is done |
| ------------------------------------------------ | ------------ |
| skipped                                          | yes          |
| no field has a value                             | no           |
| some value, a required non-boolean field empty   | no           |
| some value, every required non-boolean field set | yes          |

### The chat

- The browser loads the guide next to the schema (`loadTemplateGuide`), and the chat's empty state is `chatEmptyState(schema, step)`: the step's `question`, or its field labels, or a note that every step is answered.
- The panel shows "Conversa: etapa N de M".
- Every request sends `skipped`. The server loads the guide itself by `templateId`, recomputes the progress, and `buildInstructions` lists only the current step's fields, its suggested question, and the next step (its question, or its field names), so the agent can move on in the same reply. With no current step, it asks for a review of the panel.
- The `fill_fields` tool still accepts every field of the form, plus `skip_step`. When its output has `skip_step: true`, the hook adds the step that was current before that output's values to `skipped`.
- `skipped` lives in the hook's state: choosing another form, or reloading the page, clears it.

## What this does NOT do

- Derived steps have no `question`; the agent phrases those from the field descriptions.
- There are no skip conditions in the guide. A follow-up field (`re_number`) sits in the same step as its mark, and the agent leaves it empty when the mark is not chosen.
- Editing a field by hand moves the current step like any value does, but the chat's instructions only change on the next message.
- Five forms have a guide: IN 1 Anexo D and H, IN 2 Anexo K and L, and IN 27 Anexo C, the hand-prepared ones. The other 23 use derived steps.

## Gotchas

- Fields named `field_001`… in the auto-generated schemas make derived steps arbitrary groups of six → their names say nothing about content → write a guide for that form, or improve its schema first.
- A guide edited after its schema is regenerated keeps old field names → the template test fails with `Unknown field` → rename them in the guide.
