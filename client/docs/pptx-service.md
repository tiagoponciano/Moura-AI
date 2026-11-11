# PPTX service

How the commercial proposal deck is produced. For developers operating or extending `services/pptx`. Describes the code as it is now.

## What this is

A small Python service (FastAPI and `python-pptx`) that fills the `{{tags}}` of Moura's proposal template with the values it receives and returns the `.pptx`. It has no AI, no storage and no database; the app sends it plain values and gets a file back, the same split as the PDF service.

Invariants:

- The service never decides content. Every text in the deck is either fixed in the template or a value from the request.
- The template (`services/pptx/templates/proposal.pptx`) and the values (`ProposalValues` in `app/proposal.py`) agree exactly: a test fails when a tag has no value or a value has no tag.
- The look is the template's. Replacing the file with Moura's original deck changes the look without code changes, as long as the same tags are kept.

## Surface

| Method | Path       | Auth                                    | Returns                                          |
| ------ | ---------- | --------------------------------------- | ------------------------------------------------ |
| `GET`  | `/health`  | none                                    | `{ "status": "ok" }`                             |
| `POST` | `/render`  | `Authorization: Bearer $PPTX_SERVICE_TOKEN` | The `.pptx` (`proposta.pptx`)                |

Errors: `401` wrong or missing token, `503` when `PPTX_SERVICE_TOKEN` is not set on the service, `422` for an unknown value or a text over its limit.

## Data shapes

Body of `POST /render` (all optional, all plain text; an unknown key is refused):

| Value                                                    | Type            | Limit             | Where it goes                                  |
| -------------------------------------------------------- | --------------- | ----------------- | ---------------------------------------------- |
| `client`, `project_name`, `city_state`, `date`           | string          | 200 characters    | Cover lines                                    |
| `plan_title`                                             | string          | 200 characters    | Title of the plan card                         |
| `plan_description`                                       | string          | 600 characters    | Text under the title                           |
| `plan_items`                                             | list of strings | 20 entries        | One paragraph each, prefixed with a check mark |
| `price`                                                  | string          | 40 characters     | Price box, already formatted (e.g. `R$ 4.500,00`) |
| `excluded_items`                                         | list of strings | 20 entries        | Bullets of "Itens não incluídos"; defaults to Moura's four standard exclusions |
| `notes`                                                  | list of strings | 20 entries        | Lines of "Observações importantes"             |
| `contact_phone`, `contact_site`, `contact_email`         | string          | 200 characters    | Closing slide; default to Moura's contacts     |

## Rules and behavior

1. A paragraph made only of one tag whose value is a list becomes one paragraph per entry, with the original paragraph's formatting; an empty list removes the paragraph.
2. A tag inside a sentence (`Cliente: {{client}}`) is replaced in place. The text goes into the paragraph's first run, so its formatting is kept.
3. A tag without a value becomes empty text; `fill` returns the names so a caller can report them.
4. Dates and prices are not formatted here; the caller sends the final text.

## What this does NOT do

- It does not convert to PDF; the app sends the `.pptx` to the PDF service when it needs one.
- It does not hold Moura's photos or logo: the generated base template has a text mark and no pictures. The original deck, with its images, replaces `templates/proposal.pptx`.
- Tags inside tables or grouped shapes are not replaced; only text boxes and shapes on the slide.

## Gotchas

- The deck shows `{{tag}}` text → the replacement tag has a different spelling than the template, or sits inside a group → keep tags at the top level of the slide and use the names above.
- Formatting of a filled sentence looks uniform → the sentence had several runs and all text went to the first one → keep a sentence in one style, or split it into separate tags.

## Setup

- Local: `docker compose up -d pptx` serves it on `127.0.0.1:3002` with token `local-only`.
- Tests: from `services/pptx`, `pip install -r requirements-dev.txt` and `python -m pytest`; CI runs them in the `pptx-service` job.
- Rebuilding the base template: `python -m app.build_template` from `services/pptx`.
- Production: deploy the image (any container host) with `PPTX_SERVICE_TOKEN` set; the app side is configured in the proposal card.
