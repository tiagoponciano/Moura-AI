#!/usr/bin/env python3
"""Dump Annex A of CBMSC IN 3 (specific fire load by occupancy) to JSON.

Offline tool, same spirit as extract_tables.py: it reads what is printed (group,
division, destination, fire load in MJ/m²) and reports whether the extraction
can be trusted. It holds no rule logic.

    python extract_annex_a.py IN3.pdf --out client/features/classification/norms/in-3
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
HEADER = ["Grupo", "Divisão", "Destinação", "Carga de incêndio específica [MJ/m²]"]
DIVISION_RE = re.compile(r"^[A-M]-\d{1,2}$")


def is_header(row) -> bool:
    return [clean(c or "") for c in row] == HEADER


def parse_qfi(raw: str):
    """The load as an integer when it is a plain number, else None."""
    text = clean(raw)
    if re.fullmatch(r"\d{1,3}(\.\d{3})+|\d+", text):
        return int(text.replace(".", ""))
    return None


def extract(pdf_path: Path):
    doc = pymupdf.open(pdf_path)
    rows, pages = [], []
    group = division = ""
    for index, page in enumerate(doc):
        for grid in page.find_tables().tables:
            data = grid.extract()
            if not data or not is_header(data[0]):
                continue
            if index + 1 not in pages:
                pages.append(index + 1)
            for row in data[1:]:
                cells = [clean(c or "") for c in row]
                if len(cells) < 4 or not any(cells):
                    continue
                group = cells[0] or group
                division = cells[1] or division
                rows.append(
                    {
                        "group": group,
                        "division": division,
                        "destination": cells[2],
                        "qfi_mj_m2": parse_qfi(cells[3]),
                        "qfi_raw": cells[3],
                        "page": index + 1,
                    }
                )
    return doc, rows, pages


def checks(rows):
    look = []
    if not rows:
        return ["no rows found"]
    bad_division = sorted({r["division"] for r in rows if not DIVISION_RE.match(r["division"])})
    if bad_division:
        look.append(f"divisions that do not look like A-1..M-11: {bad_division}")
    no_dest = [r for r in rows if not r["destination"]]
    if no_dest:
        look.append(f"{len(no_dest)} row(s) without a destination")
    non_numeric = [r for r in rows if r["qfi_mj_m2"] is None]
    if non_numeric:
        samples = sorted({r["qfi_raw"] for r in non_numeric})[:5]
        look.append(f"{len(non_numeric)} row(s) whose load is not a plain number: {samples}")
    mismatched = [r for r in rows if r["division"][:1] != r["group"][:1]]
    if mismatched:
        look.append(f"{len(mismatched)} row(s) whose division is not in its group")
    seen = {}
    for r in rows:
        key = (r["division"], r["destination"])
        seen[key] = seen.get(key, 0) + 1
    duplicates = sorted(f"{d} {t}" for (d, t), n in seen.items() if n > 1)
    if duplicates:
        look.append(f"duplicate division and destination: {duplicates[:5]}")
    return look


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default="IN-3")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc, rows, pages = extract(args.pdf)
    table = {
        "doc": args.doc,
        "table": "Anexo A",
        "title": "Cargas de incêndio específicas por ocupação",
        "pages": pages,
        "rows": rows,
        "checks": {"needs_human_look": checks(rows)},
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
            "rows": len(rows),
            "sha256": digest,
            "needs_human_look": len(table["checks"]["needs_human_look"]),
        },
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(rows)} rows on pages {pages}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
