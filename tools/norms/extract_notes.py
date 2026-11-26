#!/usr/bin/env python3
"""Dump the text of a DSCI technical note, section by section, to JSON.

A technical note (Nota Técnica) has no `Art. N` lines: it has numbered sections
("1. OBJETIVO", "2. INTERPRETAÇÃO…", "3. ENTENDIMENTO TÉCNICO CONSOLIDADO") with
numbered decisions inside them. This tool keeps each section as one entry, so the
text can be searched like an instruction: the entry's `number` is the section's.
The signature block and the page headers are removed. It writes the same shape as
extract_articles.py, with no annexes.

    python extract_notes.py NT01.pdf --out client/features/classification/norms/notes/nt-01-2025 --doc NT-01-2025
"""

import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf

from extract_articles import INVISIBLE, SPACES
from extract_tables import canonical, clean, sha256_text

TOOL_VERSION = 1
HEADER = re.compile(r"^(ESTADO DE SANTA CATARINA|CORPO DE BOMBEIROS MILITAR|COMANDO-GERAL|DIRETORIA DE SEGURANÇA CONTRA INCÊNDIO)", re.I)
SIGNATURES = "Assinaturas do documento"
# "1. OBJETIVO": a number, a dot, a space and an upper-case word. "3.1. Fica" has no space after the first dot.
SECTION = re.compile(r"^(\d+)\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{3})", re.MULTILINE)


def body(page) -> str:
    lines = []
    for line in INVISIBLE.sub("", page.get_text()).splitlines():
        line = SPACES.sub(" ", line).strip()
        if not line or HEADER.match(line) or re.fullmatch(r"\d{1,2}", line):
            continue
        lines.append(line)
    return "\n".join(lines)


def split(doc):
    """Returns (preamble, sections, pages)."""
    text, starts = "", []
    for page in doc:
        starts.append(len(text))
        text += body(page) + "\n"
    cut = text.find(SIGNATURES)
    if cut != -1:
        text = text[:cut]

    def page_of(offset: int) -> int:
        return max(i + 1 for i, start in enumerate(starts) if start <= offset)

    found, expected, position = [], 1, 0
    while True:
        match = next((m for m in SECTION.finditer(text, position) if int(m.group(1)) == expected), None)
        if match is None:
            break
        found.append((expected, match.start()))
        position, expected = match.end(), expected + 1
    sections = []
    for index, (number, start) in enumerate(found):
        end = found[index + 1][1] if index + 1 < len(found) else len(text)
        sections.append({"number": number, "page": page_of(start), "text": clean(text[start:end])})
    preamble = clean(text[: found[0][1]]) if found else clean(text)
    return preamble, sections, len(doc)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", required=True)
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    args = parser.parse_args()

    preamble, sections, pages = split(pymupdf.open(args.pdf))
    look = [] if sections else ["no numbered section found"]
    data = {
        "doc": args.doc,
        "preamble": preamble,
        "articles": sections,
        "annexes": [],
        "checks": {"needs_human_look": look},
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "articles.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "doc": args.doc,
        "source_url": args.url,
        "retrieved": args.retrieved,
        "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
        "pdf_pages": pages,
        "tool_version": TOOL_VERSION,
        "pymupdf": pymupdf.__version__,
        "articles": {
            "count": len(sections),
            "annex_pages": 0,
            "sha256": sha256_text(canonical(data)),
            "needs_human_look": len(look),
        },
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{args.doc}: {len(sections)} sections")


if __name__ == "__main__":
    sys.exit(main())
