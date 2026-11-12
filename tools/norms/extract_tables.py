#!/usr/bin/env python3
"""Dump the Annex B tables of CBMSC IN 1 parte 2 to JSON, one file per table.

Offline tool: it reads a PDF you downloaded and writes what is printed there
(grid cells, footnote references, notes). It holds no rule logic and decides
nothing; every check below only reports whether the extraction can be trusted.

    python extract_tables.py IN1P2.pdf --out client/features/classification/norms/in-1-p2
"""

import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

TOOL_VERSION = 1
SUPERSCRIPTS = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹⁻", "0123456789-")
LIGATURES = str.maketrans(
    {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl", "\u00a0": " "}
)
TITLE_RE = re.compile(r"^TABELA\s+(\d+)\s*-\s*(.+)$")
NUMBER_RE = re.compile(r"^(\d{1,2})(?:\s{2,}(.*))?$")
CELL_MARK_RE = re.compile(r"^(x|-)\b|^(x|-)(?=[^\w])|^(x|-)$", re.IGNORECASE)
FOOTER_Y = 812  # page footer starts below this
ANNEX_B = "Anexo B"


def canonical(obj) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def clean(text: str) -> str:
    """Collapse whitespace and expand ligatures, keeping units such as m²."""
    return " ".join(text.translate(LIGATURES).split())


def parse_cell(raw: str) -> dict:
    """A cell is a mark (x or -), footnote references and an optional (V)."""
    text = " ".join((raw or "").split())
    cell = {"raw": text, "mark": None, "refs": [], "vital": False, "ok": False}
    match = re.match(r"^(x|-)\s*(.*)$", text, re.IGNORECASE)
    if not match:
        return cell
    cell["mark"] = match.group(1).lower()
    rest = match.group(2)
    if re.search(r"\(\s*V\s*\)", rest, re.IGNORECASE):
        cell["vital"] = True
        rest = re.sub(r"\(\s*V\s*\)", " ", rest, flags=re.IGNORECASE)
    rest = rest.translate(SUPERSCRIPTS)
    cell["refs"] = [int(n) for n in re.findall(r"\d+", rest)]
    leftover = re.sub(r"[\d\s\-–_,/]", "", rest)
    cell["ok"] = leftover == ""
    # Several references in one cell (x⁴⁻⁵, x 3_7): the separator is ambiguous
    # between a list and a range, so a person confirms it.
    cell["multi_ref"] = len(cell["refs"]) > 1
    return cell


def page_lines(page):
    """Text lines with their position: (y0, x0, y1, text)."""
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                x0, y0, _, y1 = line["bbox"]
                lines.append((y0, x0, y1, text))
    return sorted(lines)


def split_notes(lines):
    """Assign each note line to the nearest note number, then validate.

    The number sits at the vertical centre of a multi-line note, so a naive
    "text after the number" split is wrong. Returns (notes, ok, problems).
    """
    numbers = []  # (n, y_center)
    body = []  # (y_center, text)
    for y0, x0, y1, text in lines:
        centre = (y0 + y1) / 2
        match = NUMBER_RE.match(text)
        if match and x0 < 52:
            numbers.append((int(match.group(1)), centre))
            if match.group(2):
                body.append((centre, match.group(2)))
        else:
            body.append((centre, text))
    problems = []
    if not numbers:
        return [], True, problems
    if [n for n, _ in numbers] != list(range(1, len(numbers) + 1)):
        problems.append("note numbers are not 1..N in order")
    assigned = {n: [] for n, _ in numbers}
    for centre, text in body:
        nearest = min(numbers, key=lambda item: abs(item[1] - centre))[0]
        assigned[nearest].append((centre, text))
    notes = []
    for n, y in numbers:
        parts = assigned[n]
        if not parts:
            problems.append(f"note {n} has no text")
            continue
        low, high = min(c for c, _ in parts), max(c for c, _ in parts)
        if not (low - 2 <= y <= high + 2):
            problems.append(f"note {n}: number outside its lines")
        text = clean(" ".join(t for _, t in parts))
        if not text[:1].isupper():
            problems.append(f"note {n} does not start with a capital")
        if text[-1:] not in ".)":
            problems.append(f"note {n} does not end with a period")
        notes.append({"number": n, "text": text})
    return notes, not problems, problems


def table_from_grid(rows):
    """Header rows are everything before the first row that is all x/- cells."""
    header, data = [], []
    for row in rows:
        cells = [(c or "") for c in row]
        marks = [parse_cell(c) for c in cells[2:]]
        is_data = (
            len(cells) > 2
            and cells[0].strip() != ""
            and all(m["mark"] for m in marks if m["raw"])
            and any(m["raw"] for m in marks)
        )
        (data if is_data or (data and cells[0].strip()) else header).append(cells)
    return header, data


def extract(pdf_path: Path):
    doc = pymupdf.open(pdf_path)
    start = next(
        i for i, page in enumerate(doc) if ANNEX_B in page.get_text() and i > 3
    )
    tables = {}
    order = []
    current = None
    for index in range(start, len(doc)):
        page = doc[index]
        lines = page_lines(page)
        titles = []
        for y0, x0, y1, text in lines:
            match = TITLE_RE.match(clean(text))
            if match:
                titles.append((y0, int(match.group(1)), clean(match.group(2))))
        grids = sorted(page.find_tables().tables, key=lambda g: g.bbox[1])
        bounds = [(g.bbox[1], g.bbox[3]) for g in grids]

        def owner(y):
            above = [t for t in titles if t[0] <= y + 2]
            return above[-1][1] if above else current

        for _, number, title in titles:
            if number not in tables:
                tables[number] = {
                    "table": number,
                    "title": title,
                    "pages": [],
                    "grids": [],
                    "heading": [],
                    "note_lines": [],
                    "general_notes_raw": [],
                }
                order.append(number)
        for grid in grids:
            number = owner(grid.bbox[1])
            if number is None:
                continue
            record = tables[number]
            if index + 1 not in record["pages"]:
                record["pages"].append(index + 1)
            header, data = table_from_grid(grid.extract())
            record["grids"].append(
                {"page": index + 1, "header_rows": header, "data_rows": data}
            )
        for y0, x0, y1, text in lines:
            if y0 > FOOTER_Y or TITLE_RE.match(clean(text)) or ANNEX_B in text:
                continue
            if any(top - 1 <= y0 <= bottom + 1 for top, bottom in bounds):
                continue
            number = owner(y0)
            if number is None:
                continue
            record = tables[number]
            if index + 1 not in record["pages"]:
                record["pages"].append(index + 1)
            record["note_lines"].append((y0, x0, y1, text, index + 1, y0))
        if titles:
            current = titles[-1][1]
    return doc, tables, order


def build_table(record):
    note_area, general = [], []
    in_general = False
    for y0, x0, y1, text, _page, _ in record["note_lines"]:
        flat = clean(text)
        if flat.upper().startswith("NOTAS GERAIS"):
            in_general = True
            continue
        if flat.upper().startswith("NOTAS ESPEC") or flat.upper().startswith("NOTA "):
            continue
        (general if in_general else note_area).append((y0, x0, y1, text))
    notes, notes_ok, problems = split_notes(note_area)

    rows = []
    refs_used = set()
    grammar_ok = True
    widths = set()
    for grid in record["grids"]:
        for row in grid["data_rows"]:
            cells = [parse_cell(c) for c in row[2:]]
            label = clean(row[0])
            vital_label = bool(re.search(r"\(\s*V\s*\)\s*$", label, re.IGNORECASE))
            label = re.sub(r"\s*\(\s*V\s*\)\s*$", "", label, flags=re.IGNORECASE)
            grammar_ok = grammar_ok and all(c["ok"] for c in cells if c["raw"])
            widths.add(len(cells))
            for cell in cells:
                refs_used.update(cell["refs"])
            rows.append(
                {
                    "page": grid["page"],
                    "system": label,
                    "norm": clean(row[1]),
                    "vital_on_label": vital_label,
                    "cells": cells,
                }
            )
    note_numbers = {n["number"] for n in notes}
    look = []
    if not rows:
        look.append("no data rows in a grid (not an x/- table)")
    if not grammar_ok:
        look.append("a cell does not follow the x/- footnote grammar")
    if len(widths) > 1:
        look.append("data rows have different cell counts across grids")
    if not notes_ok:
        look.extend(f"notes: {p}" for p in problems)
    if notes and refs_used != note_numbers:
        look.append(
            f"footnote references {sorted(refs_used)} differ from note numbers "
            f"{sorted(note_numbers)}"
        )
    if any(c["multi_ref"] for r in rows for c in r["cells"]):
        look.append("a cell has several footnote references (list or range?)")
    table = {
        "table": record["table"],
        "title": record["title"],
        "pages": record["pages"],
        "grids": [
            {"page": g["page"], "header_rows": g["header_rows"]}
            for g in record["grids"]
        ],
        "rows": rows,
        "notes": notes,
        "general_notes_raw": [clean(t) for _, _, _, t in general],
        "checks": {"needs_human_look": look},
    }
    return table


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default="IN-1-P2")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument(
        "--verify",
        action="store_true",
        help="write nothing; fail if the PDF no longer yields the committed tables",
    )
    args = parser.parse_args()

    doc, records, order = extract(args.pdf)
    if args.verify:
        committed = json.loads((args.out / "manifest.json").read_text("utf-8"))
        expected = {t["table"]: t["sha256"] for t in committed["tables"]}
        actual = {
            n: sha256_text(canonical(build_table(records[n]))) for n in order
        }
        changed = sorted(n for n in actual if expected.get(n) != actual[n])
        missing = sorted(set(expected) - set(actual))
        print(f"changed tables: {changed or 'none'}; missing tables: {missing or 'none'}")
        return 1 if changed or missing else 0
    (args.out / "tables").mkdir(parents=True, exist_ok=True)
    manifest_tables = []
    for number in order:
        table = build_table(records[number])
        digest = sha256_text(canonical(table))
        (args.out / "tables" / f"table-{number:02d}.json").write_text(
            json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        manifest_tables.append(
            {
                "table": number,
                "title": table["title"],
                "pages": table["pages"],
                "sha256": digest,
                "needs_human_look": len(table["checks"]["needs_human_look"]),
            }
        )
    manifest = {
        "doc": args.doc,
        "source_url": args.url,
        "retrieved": args.retrieved,
        "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
        "pdf_pages": len(doc),
        "tool_version": TOOL_VERSION,
        "pymupdf": pymupdf.__version__,
        "tables": manifest_tables,
    }
    (args.out / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    flagged = [t for t in manifest_tables if t["needs_human_look"]]
    print(f"{len(manifest_tables)} tables, {len(flagged)} need a human look")
    for t in flagged:
        print(f"  table {t['table']}: {t['needs_human_look']} item(s)")


if __name__ == "__main__":
    sys.exit(main())
