#!/usr/bin/env python3
"""Dump Annex D of CBMSC IN 5 (compensatory measures for new buildings) to JSON.

Offline tool, same spirit as extract_in5_annex_c.py: one row per error parameter, with
the system, the fault and the measures as printed (footnote numbers stay glued to the
words they follow, as in the PDF). A blank system or fault cell repeats the one above.
It holds no rule logic.

    python extract_in5_annex_d.py IN5.pdf --out client/features/classification/norms/in-5
"""

import argparse
import json
import sys
from pathlib import Path

import pymupdf

from extract_tables import canonical, clean, sha256_text

PAGES = (20, 21, 22)  # 1-based, "Anexo D" and its continuations
HEADER = ["SMSCI", "SIGLA", "TIPO DE FALTA", "PARÂMETRO DE ERRO", "MEDIDAS COMPENSATÓRIAS"]


def extract(pdf_path):
    doc = pymupdf.open(pdf_path)
    rows = []
    notes = []
    system = sigla = fault = ""
    for number in PAGES:
        for table in doc[number - 1].find_tables().tables:
            for raw in table.extract():
                cells = [clean(c or "") for c in raw]
                if cells == HEADER:
                    continue
                if cells[0].startswith("Notas") or cells[0].startswith("Nota Orientação"):
                    notes.append({"page": number, "text": cells[0]})
                    continue
                system = cells[0] or system
                sigla = cells[1] or sigla
                fault = cells[2] or fault
                rows.append(
                    {
                        "page": number,
                        "system": system,
                        "sigla": sigla,
                        "fault": fault,
                        "parameter": cells[3],
                        "measures": cells[4],
                    }
                )
    return doc, rows, notes


def checks(rows, notes):
    found = []
    if len(rows) != 15:
        found.append(f"{len(rows)} rows found, 15 expected")
    for row in rows:
        if not row["parameter"] or not row["measures"]:
            found.append(f"empty cell: {row['system']} / {row['fault']}")
    if len(notes) != 2:
        found.append(f"{len(notes)} note blocks found, 2 expected")
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc, rows, notes = extract(args.pdf)
    table = {
        "doc": "IN-5",
        "table": "Anexo D",
        "title": "Medidas compensatórias para edificações novas",
        "pages": list(PAGES),
        "rows": rows,
        "notes": notes,
        "checks": {"needs_human_look": checks(rows, notes)},
    }
    digest = sha256_text(canonical(table))
    manifest_path = args.out / "manifest.json"
    manifest = json.loads(manifest_path.read_text("utf-8"))
    if args.verify:
        same = manifest.get("annex_d", {}).get("sha256") == digest
        print("unchanged" if same else "CHANGED")
        return 0 if same else 1

    (args.out / "annex-d.json").write_text(
        json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest["annex_d"] = {
        "pages": list(PAGES),
        "rows": len(rows),
        "sha256": digest,
        "needs_human_look": len(table["checks"]["needs_human_look"]),
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(rows)} rows on pages {list(PAGES)}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
