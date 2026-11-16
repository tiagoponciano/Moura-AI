#!/usr/bin/env python3
"""Dump Annex C of CBMSC IN 5 (adaptations by system) to JSON.

Offline tool, same spirit as extract_in5.py: one entry per system table, each with its
four sections (adaptations, compensations, exemptions, substitutions) as printed. It
holds no rule logic; which section applies to which class is read from arts. 21, 23
and 25 in the app.

    python extract_in5_annex_c.py IN5.pdf --out client/features/classification/norms/in-5
"""

import argparse
import json
import re
import sys
from pathlib import Path

import pymupdf

from extract_tables import canonical, clean, sha256_text

PAGES = (15, 16, 17, 18, 19)  # 1-based, "Anexo C" tables
TITLE_RE = re.compile(r"^(.+?) \(IN (\d+)\)$")
SECTIONS = {
    "adequações": "adaptations",
    "compensações": "compensations",
    "isenções": "exemptions",
    "substituições": "substitutions",
}
NOT_APPLICABLE_RE = re.compile(r"^n[ãa]o aplic", re.IGNORECASE)
GROUP_MAX = 50  # a middle cell this short names a group, not an item


def section_of(cell):
    """('adaptations', 'intro text') when the cell opens a section, else None."""
    text = clean(cell)
    head = re.match(r"^(Adequações|Compensações|Isenções|Substituições)\b:?\s*(.*)$", text)
    if not head:
        return None
    return SECTIONS[head.group(1).lower()], head.group(2).strip()


def group_label(text):
    text = clean(text).rstrip(":")
    text = re.sub(r"^Compartimen- ?tação", "Compartimentação", text)
    return text


def extract(pdf_path):
    doc = pymupdf.open(pdf_path)
    systems = []
    current = None
    section = None
    group = None
    for number in PAGES:
        page = doc[number - 1]
        for table in page.find_tables().tables:
            for raw in table.extract():
                cells = [c or "" for c in raw]
                title = TITLE_RE.match(clean(cells[0])) if cells[0].strip() else None
                if title:
                    current = {
                        "title": title.group(1),
                        "norm": f"IN {title.group(2)}",
                        "page": number,
                        "sections": {
                            key: {"intro": "", "items": []} for key in SECTIONS.values()
                        },
                    }
                    systems.append(current)
                    section = group = None
                    continue
                if current is None:
                    continue
                opened = section_of(cells[0]) if cells[0].strip() else None
                if opened:
                    section = current["sections"][opened[0]]
                    group = None
                    if opened[1] and not section["intro"]:
                        section["intro"] = opened[1]
                if section is None:
                    continue
                rest = [clean(c) for c in cells[1:] if clean(c)]
                if not rest:
                    continue
                if len(cells) >= 3 and clean(cells[1]) and len(clean(cells[1])) < GROUP_MAX:
                    group = group_label(cells[1])
                    rest = [clean(c) for c in cells[2:] if clean(c)]
                    if not rest:
                        # A short text with nothing beside it is the item itself ("não aplicável").
                        rest = [clean(cells[1])]
                        group = None
                item = {"text": " ".join(rest)}
                if group:
                    item["group"] = group
                if item not in section["items"]:
                    section["items"].append(item)
    for system in systems:
        for section in system["sections"].values():
            section["applicable"] = not (
                section["items"]
                and all(NOT_APPLICABLE_RE.match(i["text"]) for i in section["items"])
            )
    return doc, systems


def checks(systems):
    found = []
    expected = ["IN 7", "IN 9", "IN 12", "IN 19", "IN 8", "IN 14"]
    if [s["norm"] for s in systems] != expected:
        found.append(f"systems found: {[s['norm'] for s in systems]}")
    for system in systems:
        for key, section in system["sections"].items():
            if not section["items"] and not section["intro"]:
                found.append(f"{system['norm']} has no {key}")
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--verify", action="store_true")
    args = parser.parse_args()

    doc, systems = extract(args.pdf)
    table = {
        "doc": "IN-5",
        "table": "Anexo C",
        "title": "Adaptações",
        "pages": list(PAGES),
        "systems": systems,
        "checks": {"needs_human_look": checks(systems)},
    }
    digest = sha256_text(canonical(table))
    manifest_path = args.out / "manifest.json"
    manifest = json.loads(manifest_path.read_text("utf-8"))
    if args.verify:
        print("unchanged" if manifest.get("annex_c", {}).get("sha256") == digest else "CHANGED")
        return 0 if manifest.get("annex_c", {}).get("sha256") == digest else 1

    (args.out / "annex-c.json").write_text(
        json.dumps(table, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    manifest["annex_c"] = {
        "pages": list(PAGES),
        "systems": len(systems),
        "sha256": digest,
        "needs_human_look": len(table["checks"]["needs_human_look"]),
    }
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"{len(systems)} systems on pages {list(PAGES)}")
    for item in table["checks"]["needs_human_look"]:
        print(f"  look: {item}")


if __name__ == "__main__":
    sys.exit(main())
