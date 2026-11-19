#!/usr/bin/env python3
"""Dump Annex A of CBMSC IN 1 parte 1 (risk of the property, quadros 1 to 3) to JSON.

Offline tool, same spirit as extract_tables.py: it reads what is printed and reports
whether the extraction can be trusted. It holds no rule logic: what a limit means for
a building is for the rules built on top of it.

    python extract_in1_p1_annex_a.py IN1-P1.pdf --out client/features/classification/norms/in-1-p1
"""

import argparse
import datetime
import hashlib
import json
import sys
from pathlib import Path

import pymupdf

from extract_tables import canonical, clean, sha256_text

TOOL_VERSION = 1
Q1_FIRST = "Área"
Q2_HEADER = ["GRUPO", "DIVISÃO", "ALTURA - h (m)", "ÁREA - a (m²)"]
Q3_HEADER = ["GRUPO", "DIVISÃO", "CRITÉRIO"]


def annex_a_pages(doc) -> list[int]:
    """Zero-based pages from the one titled "Anexo A" up to the one before "Anexo B"."""
    start = end = None
    for index, page in enumerate(doc):
        head = clean(page.get_text())[:80]
        if start is None and head.startswith("Anexo A - Risco dos imóveis"):
            start = index
        if start is not None and head.startswith("Anexo B"):
            end = index
            break
    if start is None or end is None:
        raise SystemExit("Annex A or Annex B title not found")
    return list(range(start, end))


def extract(doc):
    quadro1, quadro2, quadro3, notes, pages = [], [], [], [], []
    group = division = ""
    for index in annex_a_pages(doc):
        pages.append(index + 1)
        for grid in doc[index].find_tables().tables:
            data = [[clean(c or "") for c in row] for row in grid.extract()]
            if not data:
                continue
            if data[0][0] == Q1_FIRST:
                for label, limit in data:
                    quadro1.append({"parameter": label, "limit": limit, "page": index + 1})
            elif data[0] == Q2_HEADER:
                for g, d, height, area in data[1:]:
                    group, division = g or group, d or division
                    quadro2.append(
                        {"group": group, "division": division, "height": height, "area": area, "page": index + 1}
                    )
            elif data[0] == Q3_HEADER:
                for g, d, criterion in data[1:]:
                    group, division = g or group, d or division
                    quadro3.append(
                        {"group": group, "division": division, "criterion": criterion, "page": index + 1}
                    )
            elif data[0][0].startswith("Notas Gerais"):
                for key, text in data[1:]:
                    notes.append({"id": key, "text": text, "page": index + 1})
    return quadro1, quadro2, quadro3, notes, pages


def checks(quadro1, quadro2, quadro3, notes):
    look = []
    if not (quadro1 and quadro2 and quadro3 and notes):
        look.append("a quadro or the notes were not found")
    empty = [r for r in quadro2 if not (r["height"] and r["area"])]
    if empty:
        look.append(f"{len(empty)} row(s) of quadro 2 without a height or an area")
    for row in quadro3:
        if row["criterion"].rstrip().endswith(" E"):
            look.append(
                f"quadro 3, {row['group']} {row['division']}: the criterion ends in an 'E' "
                "and may continue past what the PDF prints"
            )
    return look


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default="IN-1-P1")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc = pymupdf.open(args.pdf)
    quadro1, quadro2, quadro3, notes, pages = extract(doc)
    table = {
        "doc": args.doc,
        "table": "Anexo A",
        "title": "Risco dos imóveis",
        "pages": pages,
        "quadro_1_risco_ii": quadro1,
        "quadro_2_risco_iii_area_altura": quadro2,
        "quadro_3_risco_iii_criterio": quadro3,
        "notes": notes,
        "checks": {"needs_human_look": checks(quadro1, quadro2, quadro3, notes)},
    }
    digest = sha256_text(canonical(table))
    manifest_path = args.out / "manifest.json"
    if args.verify:
        expected = json.loads(manifest_path.read_text("utf-8"))["annex_a"]["sha256"]
        print("unchanged" if expected == digest else "CHANGED")
        return 0 if expected == digest else 1

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "annex-a.json").write_text(
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
        "annex_a": {
            "pages": pages,
            "rows": len(quadro1) + len(quadro2) + len(quadro3),
            "notes": len(notes),
            "sha256": digest,
            "needs_human_look": len(table["checks"]["needs_human_look"]),
        },
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{manifest['annex_a']['rows']} rows, {len(notes)} notes on pages {pages}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
