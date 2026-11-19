#!/usr/bin/env python3
"""Dump Annex B of CBMSC IN 1 parte 1 (the request form: the fields the CBMSC asks for) to JSON.

Offline tool, same spirit as extract_in1_p1_annex_a.py: it reads what is printed and
reports whether the extraction can be trusted. It holds no rule logic. A cell can name
several fields ("Bairro* Cidade* Estado*"); they stay as printed, and a `*` marks a
required field.

    python extract_in1_p1_annex_b.py IN1-P1.pdf --out client/features/classification/norms/in-1-p1
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


def annex_b_pages(doc) -> list[int]:
    """Zero-based pages from the one titled "Anexo B" up to the one before "Anexo C"."""
    start = end = None
    for index, page in enumerate(doc):
        head = clean(page.get_text())[:60]
        if start is None and head.startswith("Anexo B"):
            start = index
        if start is not None and head.startswith("Anexo C"):
            end = index
            break
    if start is None or end is None:
        raise SystemExit("Annex B or Annex C title not found")
    return list(range(start, end))


def extract(doc):
    fields, pages = [], []
    section = group = ""
    for index in annex_b_pages(doc):
        pages.append(index + 1)
        for grid in doc[index].find_tables().tables:
            for row in grid.extract():
                cells = [clean(c or "") for c in row]
                if len(cells) < 3:
                    continue
                if cells[0] and cells[0] != section:
                    section, group = cells[0], ""  # a new section starts with no group
                group = cells[1] or group
                if not cells[2]:
                    continue
                fields.append(
                    {
                        "section": section,
                        "group": group,
                        "field": cells[2],
                        "required": "*" in cells[2],
                        "page": index + 1,
                    }
                )
    return fields, pages


def checks(fields):
    look = []
    if not fields:
        return ["no fields found"]
    if not any(f["required"] for f in fields):
        look.append("no field is marked required; the `*` marks may have been lost")
    sections = {f["section"] for f in fields}
    if len(sections) < 3:
        look.append(f"only {len(sections)} section(s) found: {sorted(sections)}")
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
    fields, pages = extract(doc)
    table = {
        "doc": args.doc,
        "table": "Anexo B",
        "title": "Requerimentos para Análise, Habite-se, Funcionamento, RPCI e Eventos temporários",
        "pages": pages,
        "fields": fields,
        "checks": {"needs_human_look": checks(fields)},
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
    # The Annex A tool writes the same manifest: each keeps the other's entry.
    manifest = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}
    manifest.update(
        {
            "doc": args.doc,
            "source_url": args.url or manifest.get("source_url", ""),
            "retrieved": args.retrieved,
            "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
            "pdf_pages": len(doc),
            "tool_version": TOOL_VERSION,
            "pymupdf": pymupdf.__version__,
            "annex_b": {
                "pages": pages,
                "fields": len(fields),
                "sha256": digest,
                "needs_human_look": len(table["checks"]["needs_human_look"]),
            },
        }
    )
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(fields)} fields on pages {pages}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
