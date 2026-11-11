# Commercial proposal

How a project's commercial proposal is generated. Describes the code as it is now. The deck itself is produced by the PPTX service, described in `client/docs/pptx-service.md`.

## What this is

In the documents dialog, the "Proposta" view of the selected project takes a plan, a price and a validity, and downloads Moura's proposal as `.pptx` or PDF. The client, the building and the city come from the project's shared data. No model takes part: the app builds plain values, the PPTX service fills the template, and the PDF service converts it when a PDF is asked for.

Invariants:

- Nothing is stored: each download generates the deck again from the project's current data.
- The plans and their texts are fixed in the code (`PROPOSAL_PLANS`); the price, the validity and the project data are the only variable parts.

## Surface

`POST /api/documents/projects/:id/proposal` with `{ planId, price, validityDays?, format }`.

| Field          | Rule                                                  |
| -------------- | ----------------------------------------------------- |
| `planId`       | One of `PROPOSAL_PLANS` (today `complete-management`) |
| `price`        | Number of reais, greater than 0 and up to 10,000,000  |
| `validityDays` | Whole number from 1 to 90; defaults to 10             |
| `format`       | `pptx` or `pdf`                                       |

Returns the file as an attachment (`proposta.pptx` or `proposta.pdf`). Errors: 400 invalid id or body, 404 `Project not found` (also for an archived project), 503 when `PPTX_SERVICE_URL` or `PPTX_SERVICE_TOKEN` is missing, or when a PDF is asked and `PDF_SERVICE_URL` is missing, 502 when a service fails.

## Rules and behavior

Values sent to the PPTX service (`proposalValues`):

| Value          | Taken from                                                                      |
| -------------- | ------------------------------------------------------------------------------- |
| `client`       | `owner_name` of the project; empty when not filled                              |
| `project_name` | `property_building_name`, else `property_company_name`, else the project's name |
| `city_state`   | `property_city`; the project data has no state, so only the city                |
| `date`         | Today, `dd/mm/aaaa`, São Paulo time                                             |
| plan texts     | The plan's title, description and items                                         |
| `price`        | The number written as `R$ 4.500,00`                                             |
| `notes`        | Five fixed lines from Moura's deck, with the chosen validity in the fourth      |

A PDF is the `.pptx` converted by the PDF service's LibreOffice route.

## What this does NOT do

- It does not save the proposal, its price or a history of proposals.
- It does not write the city's state; fill it into the city field if it should appear.
- Empty project data is not an error: the deck is generated with an empty client or city.
- Only one plan exists; the other modalities of the deck are not modeled.
- The fixed notes are not editable in the screen.

## Gotchas

- "O serviço de propostas não está configurado." → `PPTX_SERVICE_URL` and `PPTX_SERVICE_TOKEN` are not set in the app's environment → set both, pointing at the PPTX service and its token.
- The deck has no photos → the template in `services/pptx/templates` is the generated base → replace it with Moura's original deck.
- A PDF fails while the `.pptx` works → the PDF service is down or not configured → download the `.pptx`.

## Setup

`PPTX_SERVICE_URL` (base URL, no trailing slash) and `PPTX_SERVICE_TOKEN` in the app's server environment; `PDF_SERVICE_*` for PDFs.
