# Norm search

How the assistants read what a norm says, instead of answering from memory. For developers changing the search or the tools that use it.

## What this is

`search_norm` is an LLM tool that looks for words in the text of the CBMSC instructions and returns the matching articles **and annex pages**, each with the instruction, the article number (not for an annex), the page and an excerpt. `read_norm_text` reads one whole article, or one whole annex page, of an instruction, for when the excerpt is not enough. The text comes from `norms/in-N/articles.json`, extracted from the PDFs of the Drive folder (see `norm-extraction.md`). The classification chat and the documents chat both have it, and their instructions tell the assistant to call it before stating what a norm requires, to cite the instruction, the article and the page, and to say so when nothing matches.

Invariants:

- **The tool reads, it does not decide.** It returns passages as printed. Nothing it returns changes an answer, a field or a result.
- **A hit is always real text.** Instruction, article and page come from the extracted file; with no match the tool returns no hit and a note, and reading an article or a page that does not exist answers a note, never an invented text.
- **The text is loaded on demand.** `lib/norm-text-loaders.ts` has one dynamic import per instruction, so a request that does not search does not load them.

## Surface

| Export                                | File                    | Contract                                                                                                                  |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `searchArticles(docs, query, limit?)` | `lib/norm-search.ts`    | The articles with the most distinct words of the query, then the most occurrences; accents and case ignored; 5 by default |
| `queryWords(query)`                   | `lib/norm-search.ts`    | The searchable words: more than 2 letters, no filler words, at most 8                                                     |
| `searchNorm(query, doc?, limit?)`     | `server/search-norm.ts` | Loads the instructions (all, or the one named: `IN 7`, `in-7` and `IN7` are the same) and searches them                   |
| `normSearchTools`                     | `server/search-norm.ts` | The `search_norm` tool; the route of the documents chat adds it to its assistant, the classification chat has it directly |

`readNormText(doc, { article?, annexPage? })` (`server/search-norm.ts`) is the reading behind `read_norm_text`: the whole text of an article, or of an annex page, of one instruction (`IN 7`, `in-7` and `IN7` are the same), at most 8,000 characters with `truncated` true when it was cut, and a note, never an invented text, when the instruction, the article or the page does not exist.

A hit is `{ doc, kind, article?, page, excerpt, matched }`, where `kind` is `article` or `annex` and an annex hit has no `article`; the excerpt is at most 700 characters around the first match, with `…` where it was cut. The tool answers `{ hits, note }`: `No instruction named X.` or `No article matches those words.` when there is nothing to show.

## On screen

A required system, once expanded in the classification panel, ends with "Norma do sistema: IN N · Ver artigos" (`SystemNormLine`). The link opens the instruction's PDF on Drive; "Ver artigos" opens a dialog (`NormDialog`) that searches that instruction's articles with the system's name, and a box to search other words. Each result shows the article, the page and the excerpt as printed, with a note to check the whole article in the PDF. The dialog calls `GET /api/classification/norm?q=<words>&doc=<IN 7>` (`handleSearchNormText`), which needs a signed-in user, refuses fewer than 3 letters with a 400 and answers the 8 best articles in `{ hits, note }`. `useNormSearch` keeps the last result on screen.

## What this does NOT do

- **The dialog shows excerpts, not whole articles.** An excerpt is at most 700 characters around the first match; the full article is in the PDF.
- **Annex pages are raw text.** They are searched and can be read, but a table loses its layout (columns run together), and a figure is only its caption. A table that matters needs its own extraction, as the ones behind the rules have.
- **No meaning, only words.** A question phrased with other words than the norm uses finds less. There is no synonym list and no ranking by importance.
- **IN 12 and IN 23 print some words glued together**, so a search for those words can miss them (the extraction flags both).
- **Not tried with a real model.** Whether the assistants call the tool at the right moments and cite well has not been checked.
