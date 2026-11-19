# Commercial proposal

How a project's commercial proposal is generated. Describes the code as it is now.

## What this is

In the documents dialog, the "Proposta" view of the selected project takes a plan, a price and a validity, and downloads Moura's proposal as `.pptx` or PDF. The client, the building and the city come from the project's shared data. No model takes part: the app builds plain values, fills the deck's `{{tags}}` itself (`fillPptx`), and only a PDF goes to an outside service, which converts the filled deck.

Invariants:

- The route stores nothing: each download generates the deck again from the project's current data. The browser keeps the file in the project's files (`client/features/projects/docs/project-files.md`).
- The plans and their texts are fixed in the code (`PROPOSAL_PLANS`); the price, the validity and the project data are the only variable parts.
- The template's tags and `proposalValues` agree exactly: a test fails when a tag has no value or a value has no tag.

## Surface

`POST /api/documents/projects/:id/proposal` with `{ planId, price, validityDays?, format }`.

| Field          | Rule                                                  |
| -------------- | ----------------------------------------------------- |
| `planId`       | One of `PROPOSAL_PLANS` (today `complete-management`) |
| `price`        | Number of reais, greater than 0 and up to 10,000,000  |
| `validityDays` | Whole number from 1 to 90; defaults to 10             |
| `format`       | `pptx` or `pdf`                                       |

Returns the file as an attachment (`proposta.pptx` or `proposta.pdf`). Errors: 400 invalid id or body, 404 `Project not found` (also for an archived project), 503 when a PDF is asked and `PDF_SERVICE_URL` is missing, 502 when the deck cannot be filled or the PDF service fails.

| Export                       | File                       | Contract                                                            |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------- |
| `proposalValues`             | `lib/proposal.ts`          | The value of every tag, from the project data and the request       |
| `fillPptx(template, values)` | `lib/render-pptx.ts`       | `{ file, missing }`: the filled deck and the tags that had no value |
| `pptxTags(template)`         | `lib/render-pptx.ts`       | Every tag of the deck                                               |
| `loadProposalTemplate()`     | `server/template-files.ts` | The template, `public/templates/proposal/proposal.pptx`             |

## Rules and behavior

Values of the deck's tags (`proposalValues`):

| Tag                                              | Taken from                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `client`                                         | `owner_name` of the project; empty when not filled                              |
| `project_name`                                   | `property_building_name`, else `property_company_name`, else the project's name |
| `city_state`                                     | `property_city`; the project data has no state, so only the city                |
| `date`                                           | Today, `dd/mm/aaaa`, São Paulo time                                             |
| `plan_title`, `plan_description`                 | The plan's title and description                                                |
| `plan_items`                                     | The plan's items, each starting with `☑ `                                       |
| `price`                                          | The number written as `R$ 4.500,00`                                             |
| `excluded_items`                                 | Four fixed exclusions, each starting with `• `                                  |
| `notes`                                          | Five fixed lines from Moura's deck, with the chosen validity in the fourth      |
| `contact_phone`, `contact_site`, `contact_email` | Moura's contact, fixed                                                          |

How `fillPptx` fills the deck, slide by slide (`ppt/slides/slideN.xml`), paragraph by paragraph of every text box:

1. The paragraph's text is its runs joined; a paragraph without a tag is left as it is. Tags are `{{name}}`, with optional spaces inside the braces.
2. A paragraph that is only one tag whose value is a list becomes one paragraph per entry, each a copy of the original with its first run's formatting. An empty list removes the paragraph.
3. Otherwise every tag is replaced by its text (a list is joined with spaces). A tag with no value becomes empty and is reported in `missing`.
4. The new text goes into the first run, keeping its formatting, and the other runs are emptied, so a tag split across runs by PowerPoint still works.

Everything outside the slides' text (layouts, images, notes) is copied unchanged. A PDF is the filled `.pptx` converted by the PDF service's LibreOffice route.

## What this does NOT do

- It does not save the proposal's price or a history of proposals.
- It does not write the city's state; fill it into the city field if it should appear.
- Empty project data is not an error: the deck is generated with an empty client or city.
- Only one plan exists; the other modalities of the deck are not modeled.
- The fixed notes, exclusions and contact are not editable in the screen.
- Tags in tables, charts or speaker notes are not filled; only text boxes.

## Gotchas

- A tag shows up empty in the deck → it has no value in `proposalValues` → add the value; the `pptxTags` test lists the difference.
- The deck has no photos → `public/templates/proposal/proposal.pptx` is a generated base → replace it with Moura's original deck, keeping the same tags.
- A new tag typed in PowerPoint is not replaced → it sits in a table, a chart or the notes → move it into a text box.
- "Não foi possível gerar a proposta agora." in production after moving the template → the file is read from disk, and `outputFileTracingIncludes` in `next.config.ts` ships only `public/templates/proposal/**` with this route → keep the template at `public/templates/proposal/proposal.pptx`.
- A PDF fails while the `.pptx` works → the PDF service is down or not configured → download the `.pptx`.

## Setup

None for the `.pptx`. `PDF_SERVICE_*` for PDFs (`document-generation.md`).
