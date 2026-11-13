#!/usr/bin/env python3
"""Dump Annex B of CBMSC IN 5 (vital, indispensable and adaptable systems by division) to JSON.

Offline tool, same spirit as extract_tables.py: it reads what is printed (one row
per group of divisions, with the abbreviations of the three columns, the legend
and the specific notes) and reports whether the extraction can be trusted. It holds
no rule logic.

    python extract_in5.py IN5.pdf --out client/features/classification/norms/in-5
"""

import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

from extract_tables import canonical, clean, sha256_text

TOOL_VERSION = 1
PAGES = (11, 12, 13, 14)  # 1-based, "Anexo B" and its continuations
DIVISION_RE = re.compile(r"^[A-M]-\d{1,2}$")
SIGLA_RE = re.compile(r"^([A-Za-z]+) - (.+)$")
NOTE_RE = re.compile(r"^(\d+) ?- ?(.+)$")
MARK_RE = re.compile(r"^([A-Za-z]+)([¹²³]*)$")
# The three columns split the page at the middle between the column titles.
COLUMNS = ("vital", "indispensable", "adaptable")


def row_bands(page):
    """Y of the horizontal rules that start at the Divisão column or before it, under the header."""
    header = next(w for w in page.get_text("words") if w[4] == "Adequáveis")
    top = header[3] + 1
    ys = set()
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                a, b = item[1], item[2]
                x0, x1, y = min(a.x, b.x), max(a.x, b.x), (a.y + b.y) / 2
                flat = abs(a.y - b.y) < 0.5
            elif item[0] == "re" and item[1].height < 1.5:
                r = item[1]
                x0, x1, y, flat = r.x0, r.x1, (r.y0 + r.y1) / 2, True
            else:
                continue
            if flat and x1 - x0 > 400 and x0 < 102 and y > top:
                ys.add(round(y))
    return sorted(ys)


def column_edges(page):
    words = {w[4]: w for w in page.get_text("words")}
    centers = [(words[t][0] + words[t][2]) / 2 for t in ("Vitais", "Indispensáveis", "Adequáveis")]
    division = words["Divisão"]
    return (
        division[2] + 2,
        (centers[0] + centers[1]) / 2,
        (centers[1] + centers[2]) / 2,
    )


def parse_mark(token: str):
    """(abbreviation, footnote numbers) of a cell token such as SA¹."""
    match = MARK_RE.match(token)
    if not match:
        return None
    notes = ["¹²³".index(c) + 1 for c in match.group(2)]
    return match.group(1), notes


def extract(pdf_path: Path):
    doc = pymupdf.open(pdf_path)
    rows, legend, notes = [], {}, []
    for number in PAGES:
        page = doc[number - 1]
        ys = row_bands(page)
        div_edge, v_edge, i_edge = column_edges(page)
        words = [w for w in page.get_text("words") if w[1] > ys[0]]
        for top, bottom in zip(ys, ys[1:]):
            band = [w for w in words if top <= (w[1] + w[3]) / 2 < bottom]
            row = {"page": number, "divisions": [], "vital": [], "indispensable": [], "adaptable": []}
            cells = {"vital": [], "indispensable": [], "adaptable": []}
            for w in sorted(band, key=lambda w: (round(w[1]), w[0])):
                x = (w[0] + w[2]) / 2
                if x < 101:
                    continue  # the group letter column
                text = clean(w[4])
                if x < div_edge:
                    if DIVISION_RE.match(text):
                        row["divisions"].append(text)
                    continue
                key = COLUMNS[0] if x < v_edge else COLUMNS[1] if x < i_edge else COLUMNS[2]
                cells[key].append(text)
            if not row["divisions"]:
                continue
            for key, tokens in cells.items():
                row[key] = [
                    {"id": mark[0], "notes": mark[1]}
                    for token in tokens
                    if token != "-" and (mark := parse_mark(token))
                ]
            rows.append(row)
    # The legend and the specific notes sit on the last page of the annex.
    lines = [clean(l) for l in doc[PAGES[-1] - 1].get_text().splitlines()]
    in_notes = False
    last = None
    for line in lines:
        if line.startswith("Notas específicas"):
            in_notes = True
            continue
        if line.startswith("NORMAS DE SEGURANÇA"):
            break
        if not in_notes:
            continue
        sigla = SIGLA_RE.match(line)
        if sigla and sigla.group(1).isalpha() and not line[0].isdigit():
            last = sigla.group(1)
            legend[last] = sigla.group(2)
            continue
        note = NOTE_RE.match(line)
        if note and not legend:
            notes.append({"number": int(note.group(1)), "text": note.group(2)})
        elif last and line:
            legend[last] += " " + line
    return doc, rows, legend, notes


def checks(rows, legend, notes):
    problems = []
    seen = [d for r in rows for d in r["divisions"]]
    for group in "ABCDEFGHIJKLM":
        if not any(d.startswith(group + "-") for d in seen):
            problems.append(f"no division of group {group}")
    for division in seen:
        if seen.count(division) > 1:
            problems.append(f"{division} appears twice")
    for row in rows:
        for key in COLUMNS:
            for mark in row[key]:
                if mark["id"] not in legend:
                    problems.append(f"{row['divisions']}: {mark['id']} is not in the legend")
                for n in mark["notes"]:
                    if n not in [x["number"] for x in notes]:
                        problems.append(f"{row['divisions']}: note {n} is not printed")
    return sorted(set(problems))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default="IN-5")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc, rows, legend, notes = extract(args.pdf)
    table = {
        "doc": args.doc,
        "table": "Anexo B",
        "title": "Sistemas e medidas de SCI vitais, indispensáveis e adequáveis por ocupação",
        "pages": list(PAGES),
        "legend": legend,
        "notes": notes,
        "rows": rows,
        "checks": {"needs_human_look": checks(rows, legend, notes)},
    }
    digest = sha256_text(canonical(table))
    manifest_path = args.out / "manifest.json"
    if args.verify:
        expected = json.loads(manifest_path.read_text("utf-8"))["annex_b"]["sha256"]
        print("unchanged" if expected == digest else "CHANGED")
        return 0 if expected == digest else 1

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "annex-b.json").write_text(
        json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest = {
        "doc": args.doc,
        "source_url": args.url,
        "retrieved": args.retrieved,
        "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
        "pdf_pages": len(doc),
        "tool_version": TOOL_VERSION,
        "pymupdf": pymupdf.__version__,
        "annex_b": {
            "pages": list(PAGES),
            "rows": len(rows),
            "sha256": digest,
            "needs_human_look": len(table["checks"]["needs_human_look"]),
        },
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(rows)} rows on pages {list(PAGES)}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
