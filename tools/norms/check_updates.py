"""Warn when a CBMSC normative instruction changed since it was extracted.

Downloads each PDF named by a manifest's `source_url`, hashes it and compares
the hash with the manifest's `pdf_sha256`. It only reports: it never rewrites a
manifest and never extracts anything. Re-run the extractors by hand after a
warning.

    python tools/norms/check_updates.py [--norms <dir>]

Exit code: 0 all current, 1 at least one changed, 2 at least one could not be checked.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

DEFAULT_NORMS = Path(__file__).resolve().parents[2] / "client/features/classification/norms"
DRIVE_ID = re.compile(r"drive\.google\.com/file/d/([\w-]+)")
DOWNLOAD = "https://drive.google.com/uc?export=download&id={id}"


@dataclass
class Source:
    manifest: str
    doc: str
    url: str
    sha256: str


def drive_download_url(source_url: str) -> str | None:
    """Direct-download URL of a Drive file link, or None when it is not one."""
    match = DRIVE_ID.search(source_url)
    return DOWNLOAD.format(id=match.group(1)) if match else None


def find_sources(norms: Path) -> list[Source]:
    """One entry per distinct (doc, URL, hash) across the manifests under `norms`."""
    seen: dict[tuple[str, str, str], Source] = {}
    for path in sorted(norms.rglob("*manifest.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not all(k in data for k in ("doc", "source_url", "pdf_sha256")):
            continue
        key = (data["doc"], data["source_url"], data["pdf_sha256"])
        seen.setdefault(
            key, Source(str(path.relative_to(norms)), data["doc"], data["source_url"], data["pdf_sha256"])
        )
    return list(seen.values())


def verdict(expected: str, actual: str) -> str:
    return "current" if expected == actual else "changed"


def fetch_sha256(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "norm-update-check"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return hashlib.sha256(response.read()).hexdigest()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--norms", type=Path, default=DEFAULT_NORMS)
    args = parser.parse_args(argv)

    changed = failed = 0
    for source in find_sources(args.norms):
        url = drive_download_url(source.url)
        if url is None:
            print(f"UNCHECKED {source.doc}: not a Drive file link ({source.url})")
            failed += 1
            continue
        try:
            state = verdict(source.sha256, fetch_sha256(url))
        except OSError as error:
            print(f"UNCHECKED {source.doc}: {error}")
            failed += 1
            continue
        if state == "changed":
            changed += 1
            print(f"CHANGED   {source.doc}: the published PDF differs from {source.manifest}; re-run the extraction")
        else:
            print(f"current   {source.doc}")
    return 1 if changed else 2 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
