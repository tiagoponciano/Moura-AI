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

## Data shapes

```jsonc
{
  "table": 5,
  "title": "GRUPO C COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m",
  "pages": [24], // 1-based PDF pages
  "grids": [
    {
      "page": 24,
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

1. **Titles and grids.** The tool starts at the page containing "Anexo B". A line `TABELA <n> - <title>` opens table `n`. Each grid PyMuPDF finds on a page belongs to the last title above it; a grid with no title above it continues the previous page's table.
2. **Header vs data rows.** The first data row is the first row whose first cell is non-empty and whose non-empty cells after the first two all start with `x` or `-`; from there on, any row with a label is data. Rows before it are header rows, kept as printed.
3. **Cell grammar.** A cell is a mark, footnote references and an optional "(V)". Unicode superscripts are read as digits and the superscript minus as `-`. `ok` is `false` when anything else is left over. A cell with more than one reference (`x⁴⁻⁵`, `x 3_7`) is `multi_ref`: the separator could mean a list or a range, so a person confirms it.
4. **Notes.** Lines below a grid, not inside any grid, are note lines. A note number sits at the vertical centre of a multi-line note, so each text line is assigned to the nearest number. The split is then validated: numbers must run 1..N, each number must lie within its own lines, and each note must start with a capital and end with a period or parenthesis. A failure becomes a `needs_human_look` entry and the notes are still written as split.
5. **Text normalization.** Whitespace is collapsed and ligatures are expanded: ﬁ, ﬂ, ﬀ, ﬃ, ﬄ and the PDF's own glyph for "ft" (`ϔ`, as in "shafts"). Units such as `m²` are kept.

`needs_human_look` entries and what to do:

| Entry                                                   | Meaning                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| no data rows in a grid (not an x/- table)               | The table is prose or another shape (Tabela 30)        |
| a cell does not follow the x/- footnote grammar         | Unparsed text in a cell                                |
| data rows have different cell counts across grids       | Grids of one table have different shapes (Tabela 3)    |
| notes: …                                                | The note split failed one validation                   |
| footnote references … differ from note numbers …        | A note is never referenced, or a reference has no note |
| a cell has several footnote references (list or range?) | See rule 3                                             |

Tables flagged in the committed run: 3, 7, 8, 10, 12, 14, 15, 20, 22, 24, 26, 27 and 30. The Vitest file pins this list, so a change in it shows up in review.

## What this does NOT do

- **It does not say what a cell requires.** An `x` with a footnote is a conditional requirement; the condition is in the note and is not encoded here.
- **It does not resolve "list or range".** `x⁴⁻⁵` is stored as references `[4, 5]`, which assumes a list; the flag asks a person to confirm.
- **It does not map system names to ids.** The same system appears under different labels across tables, and some rows cite an NBR instead of an IN.
- **It does not read Tabela 1 (occupancy classification) or any other document.** `extract_tables.py` handles only Annex B of IN 1 parte 2. Annex A of IN 3 has its own tool, `extract_annex_a.py`, described in `activity-catalog.md`.
- **It does not handle Tabela 30.** Its cells are alternative sets of measures in prose; it is dumped with a flag.
- **It does not check the PDF is the current norm.** The manifest records the hash of the file it was given; comparing against the source is a separate step.

## Gotchas

- Every table comes out as `m2` instead of `m²` → text was normalized with NFKC, which also flattens superscripts → normalize only ligatures and spaces (`clean`).
- Only some tables are found → table titles are centred on the page, so a "starts at the left margin" filter drops them → match the title by text only.
- `x⁷⁻⁸` fails the grammar → the superscript minus (U+207B) was not mapped → it is translated to `-` with the superscript digits.
- A multi-line note is split in the wrong place → taking "the text after the number" fails because the number is centred → assign each line to the nearest number, then validate.
- Regenerating changes a hash with no change in the PDF → the manifest hashes canonical JSON; if a field is added to a table, every hash changes → re-run the tool without `--verify` and commit the new files.

## Setup

```
python3 -m venv .venv && .venv/bin/pip install -r tools/norms/requirements.txt
```

Download the PDF from the CBMSC folder linked on https://cbm.sc.gov.br/index.php/sci/instrucoes-normativas. The tool is not used by the app or CI. PyMuPDF is distributed under the AGPL or a commercial licence (not verified here); that matters only if it is ever shipped in a deployed service, and here it is a local tool.
