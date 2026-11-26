#!/usr/bin/env python3
"""Keep the tables printed in the annexes of an instruction as rows and cells.

extract_articles.py keeps each annex page as flat text, which loses the grid of a
table: which number belongs under which heading. This tool finds the ruled tables on
the annex pages (the pages from the one titled "Anexo ..." on, as there) and writes
them to `annex-tables.json`, next to `articles.json`, keyed by the same page number.
It reads what is printed and holds no rule logic: cells are cleaned of PDF markup and
spaces, a row that repeats the one above it (a heading printed on every page) is dropped, and
nothing is interpreted.

    python extract_annex_tables.py IN9.pdf --out client/features/classification/norms/in-9
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

from extract_articles import ANNEX_TITLE, INVISIBLE
from extract_tables import canonical, clean, sha256_text

TOOL_VERSION = 1
GENERIC_HEADING = re.compile(r"^Col\d+$")


def cell_text(value) -> str:
    if value is None:
        return ""
    text = INVISIBLE.sub("", str(value)).replace("**", "")
    text = re.sub(r"\s+", " ", text).strip()
    return "" if GENERIC_HEADING.match(text) else text


def table_rows(table) -> list[list[str]]:
    rows = [[cell_text(c) for c in row] for row in table.extract()]
    cleaned: list[list[str]] = []
    for row in rows:
        if not any(row) or (cleaned and row == cleaned[-1]):
            continue
        cleaned.append(row)
    return cleaned


def annex_tables(doc) -> list[dict]:
    first = next(
        (i for i, page in enumerate(doc) if ANNEX_TITLE.match(clean(page.get_text())[:60])),
        len(doc),
    )
    pages = []
    for index in range(first, len(doc)):
        tables = [rows for rows in (table_rows(t) for t in doc[index].find_tables().tables) if len(rows) >= 2]
        if tables:
            pages.append({"page": index + 1, "tables": [{"rows": rows} for rows in tables]})
    return pages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()

    pages = annex_tables(pymupdf.open(args.pdf))
    data = {"pages": pages}
    (args.out / "annex-tables.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest_path = args.out / "manifest.json"
    manifest = json.loads(manifest_path.read_text("utf-8"))
    manifest["annex_tables"] = {
        "pages": len(pages),
        "tables": sum(len(p["tables"]) for p in pages),
        "sha256": sha256_text(canonical(data)),
        "tool_version": TOOL_VERSION,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{manifest['doc']}: {len(pages)} pages, {manifest['annex_tables']['tables']} tables")


if __name__ == "__main__":
    sys.exit(main())
