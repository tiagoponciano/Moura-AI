# Norm table extraction

How the Annex B tables of CBMSC IN 1 parte 2 are turned into JSON files that rules are later built from. For developers who extend the extraction to other documents or build on the extracted tables. It describes the code as it is now.

## What this is

`tools/norms/extract_tables.py` reads a PDF of IN 1 parte 2 and writes one JSON file per table of its Annex B (Tabelas 2 to 30) under `client/features/classification/norms/in-1-p2/`. The files hold what is printed: the grid cells, their footnote references and the notes below each table. The tool is offline; the app never runs it and nothing here reaches a model at runtime.

Invariants:

- **The tool reports, it does not decide.** It holds no rule logic. Whether a cell means "required" is for a later step, and only after its notes are encoded.
- **Every table carries its own verdict.** `checks.needs_human_look` lists what a person must confirm; an empty list means every automatic check passed, not that a person signed it off.
- **The PDF is not committed.** The repository keeps the tables, the notes, the source URL, the retrieval date and hashes.

## Surface

```
python tools/norms/extract_tables.py <pdf> --out <dir> [--doc IN-1-P2] [--url <source>] [--retrieved YYYY-MM-DD]
python tools/norms/extract_tables.py <pdf> --out <dir> --verify
```

| Argument      | Meaning                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `pdf`         | The downloaded IN 1 parte 2 PDF                                                                           |
| `--out`       | Output folder: `manifest.json` and `tables/table-NN.json`                                                 |
| `--verify`    | Writes nothing. Re-extracts and compares each table's hash with the committed manifest; exits 1 on a diff |
| `--retrieved` | Retrieval date stored in the manifest; defaults to today                                                  |

Output, for the committed run:

| File                                 | Holds                                                                                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `norms/in-1-p2/manifest.json`        | Source URL, retrieval date, PDF sha256, page count, tool and PyMuPDF versions, one entry per table (`table`, `title`, `pages`, `sha256`, `needs_human_look`) |
| `norms/in-1-p2/tables/table-NN.json` | One table (shape below)                                                                                                                                      |
| `norms/in-1-p2/tables.test.ts`       | Vitest checks over the committed JSON; CI needs no Python                                                                                                    |

## Checking for new versions

`tools/norms/check_updates.py` downloads the PDF behind each manifest's `source_url` (Drive file links only), hashes it and compares it with the manifest's `pdf_sha256`. It only reports: it never rewrites a manifest and never re-extracts. Run it by hand, or from a scheduled job, and re-run the extractors after a `CHANGED` line.

```
python tools/norms/check_updates.py [--norms <dir>]
```

Exit code: `0` every PDF is current, `1` at least one changed, `2` at least one could not be checked (not a Drive file link, or the download failed). Its unit tests run with `python -m unittest discover -s tools/norms -p "test_*.py"`.

### Automatic refresh

`tools/norms/refresh_norms.py` does the check and, for each PDF that changed, runs that document's extractors over it (`IN-1-P1`: Annexes A and B and the article text; `IN-1-P2`: tables, occupations and the article text; `IN-3`: Annex A and the article text; `IN-5`: Annex B, then C and D, since the first one rewrites the manifest, and the article text; every other instruction: the article text only). The article tool always runs last, because the first tools of IN 1 parte 2, IN 3 and IN 5 rewrite the whole manifest. The workflow `.github/workflows/norm-updates.yml` runs it every Monday and on demand: when something changed it pushes a branch `chore/norm-update-<date>` with the regenerated JSON and opens a pull request (or an issue, if the repository does not let Actions open pull requests); when a check could not run it opens or updates the issue "Norm check could not run". It never merges. It rewrites only the extracted JSON and the manifests: the rules, their notes, the review sheets and the tests that pin contents are coded by hand, so a person reviews the diff and updates them. Re-running it over the PDFs already extracted gives identical files.

## IN 1 parte 1, Annex A

`tools/norms/extract_in1_p1_annex_a.py <pdf> --out client/features/classification/norms/in-1-p1` reads Annex A (risk of the property) and writes `annex-a.json` and a `manifest.json` for `IN-1-P1`. The file holds the three quadros as printed: quadro 1 (the limits of risk II: area, height, GLP, capacity, flammable liquids and the activities not allowed), quadro 2 (risk III by group and division, with a height band and its area limit; a blank group or division cell repeats the one above) and quadro 3 (risk III by criterion, for group F and M-8), plus the general notes a to e. Limits stay as text (`≤ 5.000`, `6 < h ≤ 12`): turning them into numbers is for the rules that use them. The criterion of group F ends in an "E" in the PDF itself, so it is listed in `checks.needs_human_look` for a person to confirm against the printed norm. `norms/in-1-p1/annex-a.test.ts` checks the committed JSON in CI. The tool is not covered by an automated test of its own.

## IN 1 parte 1, Annex B

`tools/norms/extract_in1_p1_annex_b.py <pdf> --out client/features/classification/norms/in-1-p1` reads Annex B, the request form of the CBMSC (the fields asked for the analysis, the habite-se, the operating permit, the RPCI and temporary events), and writes `annex-b.json`, adding an `annex_b` entry to the shared `manifest.json`. Each row is one cell of the form with its section (`DADOS DO IMÓVEL`, `ABA ANÁLISE`, `IDENTIFICAÇÃO NOMINAL`…), its group (`Responsável Contábil`…) and the text as printed; one cell can name several fields (`Bairro* Cidade* Estado*`), and a `*` marks a required one, which is `required: true`. A blank section or group cell repeats the one above, and a new section starts with no group. The tool holds no rule logic. Both IN 1 parte 1 tools keep each other's entry in the manifest, so they can run in either order. `norms/in-1-p1/annex-b.test.ts` checks the committed JSON in CI. The tool is not covered by an automated test of its own.

## The text of every instruction

`tools/norms/extract_articles.py <pdf> --out client/features/classification/norms/in-N` keeps the text of an instruction article by article in `articles.json`, and adds an `articles` entry to the folder's `manifest.json` (the tools of one instruction keep each other's entries). It covers the 33 documents of the CBMSC Drive folder that have articles: IN 1 parte 1 and 2, IN 2 to IN 15, IN 18 to IN 31, IN 33, IN 34 and IN 35. IN 16, IN 17 and IN 32 do not exist.

The same tool keeps the **Cartilha para RTs** (the CBMSC guide to the documents a responsible engineer must hand in for the analysis and the habite-se inspection, in `norms/cartilha`, six pages: six articles and Annexes A and B) as the document `CARTILHA`. It is searched by `search_norm` like an instruction, listed in the administration's Normas tab and refreshed with the others. The two 2025 technical notes of the DSCI in the same folder (`NT-01-2025`, escadas com ventilação para o exterior, and `NT-02-2025`, DRT para montagem de palcos) have no articles, so `tools/norms/extract_notes.py <pdf> --out client/features/classification/norms/notes/nt-… --doc NT-…` keeps each numbered section (Objetivo, Interpretação, Entendimento consolidado…) as one entry in the same shape; the signature block and the page headers are removed. Their `number` is the section's, shown as `item N`. They are searched by name like the others, but are not in the weekly refresh. The equation of NT-01 (the projection of the vertical flap, `Aba = 1,44 − x²`) comes out as text, but check it against the PDF before relying on it.

An article starts on a line that begins with `Art. N`, and only the next number in sequence is accepted, so a cross-reference at the start of a line is not taken for an article. The file holds the `preamble` (the text before article 1), the `articles` (number, page, text) and the `annexes`: from the first page titled "Anexo …" on, page by page, as raw text, because their tables need their own extraction. Page footers are removed, and so are the invisible direction marks some PDFs wrap around each word. `checks.needs_human_look` lists what a person must confirm: a sequence that stops early, articles with almost no text, or words glued together because the PDF prints without spaces (IN 12 and IN 23 do). The tool holds no rule logic and is not covered by an automated test of its own; `norms/articles.test.ts` checks every committed `articles.json` in CI (hash, counts, numbering without a gap, page order).

## Annex tables of IN 7, 8 and 9

`tools/norms/extract_annex_tables.py <pdf> --out client/features/classification/norms/in-N` finds the ruled tables on the annex pages and writes them to `annex-tables.json` as rows of cells, keyed by the same page number as `articles.json`, adding an `annex_tables` entry (pages, tables and hash) to `manifest.json`. Cells are cleaned of PDF markup and extra spaces and a row that repeats the one above it (a heading printed on every page) is dropped; nothing is interpreted, and a merged heading stays repeated over the columns it spans. IN 7 has 7 tables on 4 pages (hose types, system types, the commissioning report), IN 8 has 14 on 10 (safety distances, extinguishers, appliances) and IN 9 has 12 on 9 (stairs by height and occupation, population density and passage capacity, maximum distance to walk, the elevator report). `read_norm_text` gives an annex page of these three the tables as a Markdown grid first and the page text after (`pageTablesMarkdown` in `lib/annex-tables.ts`, loaded by `NORM_TABLE_LOADERS`). Search still looks at the page text only. The weekly refresh re-extracts them after the article text. The technical notes are not refreshed (`NOT_REFRESHED`).

## IN 5, Annex D

`tools/norms/extract_in5_annex_d.py <pdf> --out client/features/classification/norms/in-5` reads Annex D (compensatory measures for new buildings) and writes `annex-d.json`, adding an `annex_d` entry with its hash to `manifest.json`. Each row is one error parameter: the system and its abbreviation (AVtr, GCC, SHP, SE), the fault, the parameter (such as `2% < L ≤10%`) and the measures as printed; a blank system or fault cell repeats the one above, and the table's continuation across three pages is joined. Footnote numbers stay glued to the words they follow, as in the PDF. The notes under the table are kept apart. `--verify` compares the hash with the manifest and `norms/in-5/annex-d.test.ts` checks the committed JSON in CI. `lib/annex-d.ts` reads it (see `existing-buildings.md`). The tool is not covered by an automated test of its own.

## IN 5, Annex C

`tools/norms/extract_in5_annex_c.py <pdf> --out client/features/classification/norms/in-5` reads Annex C (adaptations) and writes `annex-c.json`, adding an `annex_c` entry with its hash to `manifest.json`. There is one entry per system table (IN 7, 9, 12, 19, 8 and 14), each with four sections as printed: adaptations (`adequações`), compensations, exemptions and substitutions. A section holds its introduction and its items with their letter and, where the table has them, a group (`I - Quando já instalado`, `Compartimentação Horizontal`). A section that says "não aplicável" has `applicable: false`. The IN 9 table continues across two pages, so repeated rows are kept once. `--verify` compares the hash with the manifest and `norms/in-5/annex-c.test.ts` checks the committed JSON in CI. The tool holds no rule logic: which section applies to which class is for arts. 21, 23 and 25 (see `existing-buildings.md`). The tool is not covered by an automated test of its own.

## IN 5, Annex B

`tools/norms/extract_in5.py <pdf> --out client/features/classification/norms/in-5` reads Annex B of IN 5 (existing and recent buildings) and writes `annex-b.json` and `manifest.json`. Each row is a group of divisions with the abbreviations of its vital, indispensable and adaptable systems (with footnote numbers), plus the printed legend and notes. Rows are found from the table rules and the columns from the header positions. `--verify` compares the hash with the manifest. The abbreviation `BI` (brigade) is used in the table but missing from the printed legend, so every row using it is listed in `checks.needs_human_look`. `norms/in-5/annex-b.test.ts` checks the committed JSON in CI.

## Data shapes

```jsonc
{
  "table": 5,
  "title": "GRUPO C COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m",
  "pages": [24], // 1-based PDF pages
  "headings": [], // lines above a grid of the table, such as "DIVISÃO A-1 (…)" in Tabela 3
  "grids": [
    {
      "page": 24,
      "part": 0, // grids of one table that start with a heading are numbered; a grid without one continues the last
      "header_rows": [
        [
          "",
          "",
          "Térreo",
          "H ≤ 6",
          "6 < H ≤ 12",
          "12 < H ≤ 23",
          "23 < H ≤ 30",
          "> 30",
        ],
      ],
    },
  ],
  "rows": [
    {
      "page": 24,
      "system": "Chuveiros automáticos",
      "norm": "IN 15", // as printed; may be an NBR for some systems
      "vital_on_label": false, // "(V)" written on the row label
      "cells": [
        {
          "raw": "x²",
          "mark": "x",
          "refs": [2],
          "vital": false,
          "ok": true,
          "multi_ref": false,
        },
      ],
    },
  ],
  "notes": [
    {
      "number": 2,
      "text": "Dispensado para C-1. Exigido para (C-2 com área > 3.000 m² …",
    },
  ],
  "general_notes_raw": [], // "NOTAS GERAIS" lines, unsplit
  "checks": { "needs_human_look": [] },
}
```

`mark` is `"x"` (the cell is marked) or `"-"` (not marked). `refs` are footnote numbers read from superscripts. `vital` is `true` when the cell itself carries "(V)". Areas are in m² and heights in m, as printed. The `sha256` in the manifest is over the table's canonical JSON (keys sorted, no spaces), not over the file bytes.

## Rules and behavior

1. **Titles and grids.** The tool starts at the page containing "Anexo B". A line `TABELA <n> - <title>` opens table `n`. Each grid PyMuPDF finds on a page belongs to the last title above it; a grid with no title above it continues the previous page's table. A grid that starts with a heading row begins a new `part` of the table; a `TableSpec` may name the `part` it compiles (Tabela 3 has two: A-1 by type of construction and A-2/A-3 by height); a grid without one, such as a row that falls on the next page, continues the last part. Every row records its `part`.
2. **Header vs data rows.** The first data row is the first row whose first cell is non-empty and whose non-empty cells after the first two all start with `x` or `-`; from there on, any row with a label is data. Rows before it are header rows, kept as printed.
3. **Cell grammar.** A cell is a mark, footnote references and an optional "(V)". Unicode superscripts are read as digits and the superscript minus as `-`. `ok` is `false` when anything else is left over. A cell with more than one reference (`x⁴⁻⁵`, `x 3_7`) is `multi_ref`: the separator could mean a list or a range, so a person confirms it.
4. **Notes.** Lines not inside any grid are note lines, except a line above a grid of the same table, which is a heading and goes to `headings`. Notes are split one page at a time. A note number sits at the vertical centre of a multi-line note, so "nearest number" fails when neighbours differ in length; instead the lines are grouped into contiguous runs, one per number, so that every number lies inside its own lines, choosing the grouping that keeps each number nearest the middle of its note. The split is then validated: numbers must run 1..N across the pages, each number must lie within its own lines, and each note must start with a capital and end with a period or parenthesis. A failure becomes a `needs_human_look` entry and the notes are still written as split.
5. **Text normalization.** Whitespace is collapsed and ligatures are expanded: ﬁ, ﬂ, ﬀ, ﬃ, ﬄ and the PDF's own glyph for "ft" (`ϔ`, as in "shafts"). Units such as `m²` are kept.

`needs_human_look` entries and what to do:

| Entry                                                   | Meaning                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| no data rows in a grid (not an x/- table)               | The table is prose or another shape (Tabela 30)        |
| a cell does not follow the x/- footnote grammar         | Unparsed text in a cell                                |
| data rows of one part have different cell counts        | Rows of one part of a table do not line up             |
| notes: …                                                | The note split failed one validation                   |
| footnote references … differ from note numbers …        | A note is never referenced, or a reference has no note |
| a cell has several footnote references (list or range?) | See rule 3                                             |

Tables flagged in the committed run: 3 (note 13 is cited in a grid heading, not in a data cell, and note 18 has no final period), 7, 8, 10, 12, 14, 15, 20, 22, 24, 26, 27 and 30. The Vitest file pins this list, so a change in it shows up in review.

## What this does NOT do

- **It does not say what a cell requires.** An `x` with a footnote is a conditional requirement; the condition is in the note and is not encoded here.
- **It does not resolve "list or range".** `x⁴⁻⁵` is stored as references `[4, 5]`, which assumes a list; the flag asks a person to confirm.
- **It does not map system names to ids.** The same system appears under different labels across tables, and some rows cite an NBR instead of an IN.
- **It does not read Tabela 1 (occupancy classification) or any other document.** `extract_tables.py` handles only Annex B of IN 1 parte 2. Tabela 1 and Annex A of IN 3 have their own tools, `extract_occupations.py` and `extract_annex_a.py`, described in `activity-catalog.md`.
- **It does not handle Tabela 30.** Its cells are alternative sets of measures in prose; it is dumped with a flag.
- **It does not check the PDF is the current norm.** The manifest records the hash of the file it was given; comparing against the source is a separate step.

## Gotchas

- Every table comes out as `m2` instead of `m²` → text was normalized with NFKC, which also flattens superscripts → normalize only ligatures and spaces (`clean`).
- Only some tables are found → table titles are centred on the page, so a "starts at the left margin" filter drops them → match the title by text only.
- `x⁷⁻⁸` fails the grammar → the superscript minus (U+207B) was not mapped → it is translated to `-` with the superscript digits.
- A multi-line note is split in the wrong place → taking "the text after the number" fails because the number is centred → group the lines into contiguous runs so that each number falls inside its own, then validate ("nearest number" failed when neighbours differed in length, as in Tabela 3).
- The notes of a table that spans two pages are mixed, or a heading is read as a note → the y positions of different pages were compared, or the heading sat above a grid → split per page and treat a line above a grid of the same table as a heading.
- Regenerating changes a hash with no change in the PDF → the manifest hashes canonical JSON; if a field is added to a table, every hash changes → re-run the tool without `--verify` and commit the new files.

## Setup

```
python3 -m venv .venv && .venv/bin/pip install -r tools/norms/requirements.txt
```

Download the PDF from the CBMSC folder linked on https://cbm.sc.gov.br/index.php/sci/instrucoes-normativas. The tool is not used by the app or CI. PyMuPDF is distributed under the AGPL or a commercial licence (not verified here); that matters only if it is ever shipped in a deployed service, and here it is a local tool.
