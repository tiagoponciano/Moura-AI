"""Re-extract the norms whose published PDF changed.

For each source named by a manifest, downloads the PDF and, when its hash differs
from the manifest's `pdf_sha256`, runs that document's extractors over it. It only
rewrites the extracted JSON and the manifests; rules, notes and tests are coded by
hand and are for a person to review in the pull request this feeds.

    python tools/norms/refresh_norms.py [--norms <dir>] [--dry-run]

Prints the changed documents, one per line, as `CHANGED <doc>`. Exit code: 0 nothing
changed, 1 something was re-extracted (or would be, with --dry-run), 2 a check or
an extractor failed.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from check_updates import DEFAULT_NORMS, Source, drive_download_url, find_sources

TOOLS = Path(__file__).resolve().parent

# The extractors of each document, in the order they must run: `extract_in5.py` writes
# the whole manifest, so the annex tools that add to it come after.
EXTRACTORS: dict[str, tuple[tuple[str, str], ...]] = {
    "IN-1-P2": (("extract_tables.py", "in-1-p2"), ("extract_occupations.py", "in-1-p2")),
    "IN-3": (("extract_annex_a.py", "in-3"),),
    "IN-5": (
        ("extract_in5.py", "in-5"),
        ("extract_in5_annex_c.py", "in-5"),
        ("extract_in5_annex_d.py", "in-5"),
    ),
}
# Tools that take the source link and the retrieval date to write into the manifest.
WITH_SOURCE = {"extract_tables.py", "extract_occupations.py", "extract_annex_a.py", "extract_in5.py"}


def plan(source: Source, pdf: Path, norms: Path, today: str) -> list[list[str]]:
    """The extractor commands for a changed document; raises KeyError for an unknown one."""
    commands = []
    for tool, folder in EXTRACTORS[source.doc]:
        command = [sys.executable, str(TOOLS / tool), str(pdf), "--out", str(norms / folder)]
        if tool in WITH_SOURCE:
            command += ["--url", source.url, "--retrieved", today]
        commands.append(command)
    return commands


def download(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "norm-refresh"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--norms", type=Path, default=DEFAULT_NORMS)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    today = datetime.date.today().isoformat()

    changed = failed = 0
    for source in find_sources(args.norms):
        url = drive_download_url(source.url)
        if url is None or source.doc not in EXTRACTORS:
            print(f"UNCHECKED {source.doc}: no download link or no extractors")
            failed += 1
            continue
        try:
            data = download(url)
        except OSError as error:
            print(f"UNCHECKED {source.doc}: {error}")
            failed += 1
            continue
        if hashlib.sha256(data).hexdigest() == source.sha256:
            print(f"current   {source.doc}")
            continue
        print(f"CHANGED {source.doc}")
        changed += 1
        if args.dry_run:
            continue
        with tempfile.TemporaryDirectory() as tmp:
            pdf = Path(tmp) / f"{source.doc}.pdf"
            pdf.write_bytes(data)
            for command in plan(source, pdf, args.norms, today):
                if subprocess.run(command, cwd=TOOLS).returncode != 0:
                    print(f"FAILED    {source.doc}: {Path(command[1]).name}")
                    failed += 1
                    break
    return 2 if failed else 1 if changed else 0


if __name__ == "__main__":
    sys.exit(main())
