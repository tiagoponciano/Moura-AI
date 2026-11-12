#!/usr/bin/env python3
"""Dump Tabela 1 of CBMSC IN 1 parte 2 (classification of occupations) to JSON.

Offline tool, same spirit as extract_tables.py: it reads what is printed and
reports whether the extraction can be trusted. It holds no rule logic.

    python extract_occupations.py IN1P2.pdf --out client/features/classification/norms/in-1-p2
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
HEADER = ["Grupo", "Ocupação", "Divisão", "Descrição", "Destinação"]
DIVISION_RE = re.compile(r"^[A-M]-\d{1,2}$")


def extract(pdf_path: Path):
    doc = pymupdf.open(pdf_path)
    rows, pages, notes = [], [], []
    group = occupation = ""
    for index, page in enumerate(doc):
        for grid in page.find_tables().tables:
            data = grid.extract()
            if not data or [clean(c or "") for c in data[0]] != HEADER:
                continue
            if index + 1 not in pages:
                pages.append(index + 1)
            for row in data[1:]:
                cells = [clean(c or "") for c in row]
                if len(cells) < 5 or not any(cells):
                    continue
                if cells[0].startswith("*") and not any(cells[1:]):
                    notes.append(cells[0])
                    continue
                group = cells[0] or group
                occupation = cells[1] or occupation
                rows.append(
                    {
                        "group": group,
                        "occupation": occupation,
                        "division": cells[2],
                        "description": cells[3],
                        "destination": cells[4],
                        "page": index + 1,
                    }
                )
    return doc, rows, pages, notes


def checks(rows):
    look = []
    if not rows:
        return ["no rows found"]
    bad = [r["division"] for r in rows if not DIVISION_RE.match(r["division"])]
    if bad:
        look.append(f"divisions that do not look like A-1..M-11: {bad}")
    wrong_group = [r["division"] for r in rows if r["division"][:1] != r["group"][:1]]
    if wrong_group:
        look.append(f"divisions outside their group: {wrong_group}")
    ids = [r["division"] for r in rows]
    dup = sorted({d for d in ids if ids.count(d) > 1})
    if dup:
        look.append(f"divisions listed more than once: {dup}")
    empty = [r["division"] for r in rows if not r["description"]]
    if empty:
        look.append(f"divisions without a description: {empty}")
    return look


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default="IN-1-P2")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc, rows, pages, notes = extract(args.pdf)
    table = {
        "doc": args.doc,
        "table": "Tabela 1",
        "title": "Classificação das ocupações",
        "pages": pages,
        "rows": rows,
        "notes": notes,
        "checks": {"needs_human_look": checks(rows)},
    }
    digest = sha256_text(canonical(table))
    manifest_path = args.out / "occupations.manifest.json"
    if args.verify:
        expected = json.loads(manifest_path.read_text("utf-8"))["sha256"]
        print("unchanged" if expected == digest else "CHANGED")
        return 0 if expected == digest else 1

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "occupations.json").write_text(
        json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest = {
        "doc": args.doc,
        "source_url": args.url,
        "retrieved": args.retrieved,
        "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
        "tool_version": TOOL_VERSION,
        "pymupdf": pymupdf.__version__,
        "pages": pages,
        "rows": len(rows),
        "sha256": digest,
        "needs_human_look": len(table["checks"]["needs_human_look"]),
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(rows)} divisions on pages {pages}; notes: {notes}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
