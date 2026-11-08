# Conversation steps

How a form is split into the steps the documents agent asks about, one at a time. Describes the code as it is now, in `features/documents/lib/conversation-steps.ts`.

## What this is

Every template has an ordered list of steps; each step is a group of field names the agent asks about together. Steps come from the form itself: either derived from the schema, or written by hand in a `<id>.guide.json` next to it.

Invariants:

- Every field of the schema is in exactly one step. Nothing is asked twice, nothing is skipped.
- Steps follow the order of the fields in the schema, which is the order of the document.
- A guide, when present, replaces the derived steps entirely; the two are never mixed.

## Rules and behavior

`conversationSteps(schema, guide?)` returns `guide.steps` when a guide is passed, otherwise `deriveSteps(schema)`.

`deriveSteps` walks the fields in order and starts a new step when:

| Next field    | Current step holds                      | Result                    |
| ------------- | --------------------------------------- | ------------------------- |
| a mark        | only marks, fewer than the limit        | joins the step            |
| a mark        | any plain field, or the limit           | starts a new step         |
| a plain field | only marks, fewer than the limit        | joins (it completes them) |
| a plain field | marks and a plain field, or the limit   | starts a new step         |
| a plain field | only plain fields, fewer than the limit | joins the step            |
| a plain field | only plain fields, at the limit         | starts a new step         |

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

## What this does NOT do

- Nothing uses the steps yet: the chat still receives the full field list (`server/instructions.ts`). Driving the conversation by step is a separate change.
- Derived steps have no `question`; the agent phrases those from the field descriptions.
- There are no skip conditions. A follow-up field (`re_number`) sits in the same step as its mark, and the agent leaves it empty when the mark is not chosen.
- Only IN 1 Anexo D has a guide.

## Gotchas

- Fields named `field_001`… in the auto-generated schemas make derived steps arbitrary groups of six → their names say nothing about content → write a guide for that form, or improve its schema first.
- A guide edited after its schema is regenerated keeps old field names → the template test fails with `Unknown field` → rename them in the guide.
