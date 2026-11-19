#!/usr/bin/env python3
"""Dump the text of a CBMSC instruction, article by article, to JSON.

Offline tool, same spirit as extract_tables.py: it reads what is printed and reports
whether the extraction can be trusted. It holds no rule logic. An article starts on a
line that begins with `Art. N`, and only the next number in sequence is accepted, so a
cross-reference at the start of a line is not taken for an article. Pages from the one
titled "Anexo ..." on are kept as annexes, page by page, and the text before the first
article is the preamble. Page footers are removed.

    python extract_articles.py IN7.pdf --out client/features/classification/norms/in-7
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
FOOTER = "NORMAS DE SEGURANÇA CONTRA INCÊNDIO"
ARTICLE = re.compile(r"^Art\.\s*(\d+)(?!\d)", re.MULTILINE)
ANNEX_TITLE = re.compile(r"^(ANEXO|Anexo)\s+[A-Z0-9]+\b")
SPACES = re.compile(r"[ \t ]+")
# Some PDFs wrap every word in invisible direction marks, which hide "Art." from the match.
INVISIBLE = re.compile("[\u200b-\u200f\u202a-\u202e\u2060\ufeff]")


def page_body(page) -> str:
    """The page text without its footer, lines kept."""
    text = INVISIBLE.sub("", page.get_text())
    cut = text.rfind(FOOTER)
    if cut != -1 and len(text) - cut < 300:
        text = text[:cut]
    return "\n".join(SPACES.sub(" ", line).strip() for line in text.splitlines())


def is_annex(text: str) -> bool:
    return bool(ANNEX_TITLE.match(clean(text)[:60]))


def split(doc):
    """Returns (preamble, articles, annexes, pages) from the PDF."""
    bodies = [page_body(page) for page in doc]
    first_annex = next((i for i, b in enumerate(bodies) if is_annex(b)), len(bodies))
    # One string for the articles, with the offset where each page starts.
    text, starts = "", []
    for body in bodies[:first_annex]:
        starts.append(len(text))
        text += body + "\n"

    def page_of(offset: int) -> int:
        page = 1
        for index, start in enumerate(starts):
            if start <= offset:
                page = index + 1
        return page

    found, expected, position = [], 1, 0
    while True:
        match = next(
            (m for m in ARTICLE.finditer(text, position) if int(m.group(1)) == expected),
            None,
        )
        if match is None:
            break
        found.append((expected, match.start()))
        position, expected = match.end(), expected + 1

    articles = []
    for index, (number, start) in enumerate(found):
        end = found[index + 1][1] if index + 1 < len(found) else len(text)
        articles.append(
            {"number": number, "page": page_of(start), "text": clean(text[start:end])}
        )
    preamble = clean(text[: found[0][1]]) if found else clean(text)

    annexes = [
        {"page": i + 1, "title": clean(bodies[i])[:80], "text": clean(bodies[i])}
        for i in range(first_annex, len(bodies))
    ]
    return preamble, articles, annexes, len(bodies)


def checks(articles, annexes, pages):
    look = []
    if not articles:
        look.append("no article found; the instruction may not use `Art. N` lines")
        return look
    last_page = articles[-1]["page"]
    if not annexes and last_page < pages // 2:
        look.append(
            f"the last article is on page {last_page} of {pages}; the sequence may have stopped early"
        )
    words = [w for a in articles for w in a["text"].split()]
    glued = sum(1 for w in words if len(w) > 30 and not w.startswith("http"))
    if words and glued / len(words) > 0.002:
        look.append(
            f"{glued} words longer than 30 characters: the PDF may print without spaces, so words are glued together"
        )
    short = [a["number"] for a in articles if len(a["text"]) < 20]
    if short:
        look.append(f"articles with almost no text: {short[:10]}")
    return look


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--doc", default=None, help="defaults to the output folder name, upper case")
    parser.add_argument("--url", default="")
    parser.add_argument("--retrieved", default=datetime.date.today().isoformat())
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    doc_code = args.doc or args.out.name.upper()

    doc = pymupdf.open(args.pdf)
    preamble, articles, annexes, pages = split(doc)
    data = {
        "doc": doc_code,
        "preamble": preamble,
        "articles": articles,
        "annexes": annexes,
        "checks": {"needs_human_look": checks(articles, annexes, pages)},
    }
    digest = sha256_text(canonical(data))
    manifest_path = args.out / "manifest.json"
    if args.verify:
        expected = json.loads(manifest_path.read_text("utf-8"))["articles"]["sha256"]
        print("unchanged" if expected == digest else "CHANGED")
        return 0 if expected == digest else 1

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "articles.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    # Other tools of the same instruction write this manifest too: each keeps the others' entries.
    manifest = json.loads(manifest_path.read_text("utf-8")) if manifest_path.exists() else {}
    manifest.update(
        {
            "doc": doc_code,
            "source_url": args.url or manifest.get("source_url", ""),
            "retrieved": args.retrieved,
            "pdf_sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
            "pdf_pages": pages,
            "tool_version": manifest.get("tool_version", TOOL_VERSION),
            "pymupdf": pymupdf.__version__,
            "articles": {
                "count": len(articles),
                "annex_pages": len(annexes),
                "sha256": digest,
                "needs_human_look": len(data["checks"]["needs_human_look"]),
            },
        }
    )
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{doc_code}: {len(articles)} articles, {len(annexes)} annex pages")
    for item in data["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
