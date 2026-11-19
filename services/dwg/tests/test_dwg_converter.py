"""The DWG output, checked with LibreDWG itself. Skipped where `dxf2dwg` is not installed."""

import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest

from app.dxf import dxf_to_dwg, to_dxf
from app.geometry import Line, Plan, Text

pytestmark = pytest.mark.skipif(
    shutil.which("dxf2dwg") is None or shutil.which("dwgread") is None,
    reason="LibreDWG is not installed",
)


def plan() -> Plan:
    return Plan(
        width=100,
        height=100,
        lines=[Line(0, 0, 100, 0), Line(100, 0, 100, 100), Line(100, 100, 0, 100), Line(0, 100, 0, 0)],
        texts=[Text(10, 10, 3, "SALA 01")],
    )


def test_the_dwg_is_an_autocad_file_that_libredwg_reads_back():
    dwg = dxf_to_dwg(to_dxf(plan()))
    assert dwg[:6] == b"AC1015"  # AutoCAD 2000
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "plan.dwg"
        path.write_bytes(dwg)
        result = subprocess.run(["dwgread", "-v1", str(path)], capture_output=True, text=True)
    assert result.returncode == 0
    assert "SUCCESS" in result.stdout + result.stderr


def test_the_dwg_keeps_every_line_of_the_plan():
    dwg = dxf_to_dwg(to_dxf(plan()))
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / "plan.dwg"
        path.write_bytes(dwg)
        result = subprocess.run(
            ["dwgread", "-O", "json", "-o", str(Path(folder) / "plan.json"), str(path)],
            capture_output=True,
        )
        assert result.returncode == 0
        import json

        data = json.loads((Path(folder) / "plan.json").read_text())
    entities = [o.get("entity") for o in data.get("OBJECTS", [])]
    assert entities.count("LINE") == 4
