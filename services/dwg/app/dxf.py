"""Writing the DXF, and the DWG when a converter is installed."""

import io
import shutil
import subprocess
import tempfile
from pathlib import Path

import ezdxf

from .geometry import Plan

LINE_LAYER = "LINHAS"
TEXT_LAYER = "TEXTO"


def to_dxf(plan: Plan) -> bytes:
    """A DXF with the plan's lines and texts, in millimeters (paper size, scale 1:1)."""
    doc = ezdxf.new("R2010", setup=True)
    doc.units = ezdxf.units.MM
    doc.layers.add(LINE_LAYER, color=7)
    doc.layers.add(TEXT_LAYER, color=2)
    space = doc.modelspace()
    for line in plan.lines:
        space.add_line((line.x1, line.y1), (line.x2, line.y2), dxfattribs={"layer": LINE_LAYER})
    for text in plan.texts:
        space.add_text(
            text.value,
            height=max(text.height, 0.5),
            dxfattribs={"layer": TEXT_LAYER, "insert": (text.x, text.y)},
        )
    stream = io.StringIO()
    doc.write(stream)
    return stream.getvalue().encode("utf-8")


def dwg_converter() -> str | None:
    """The `dxf2dwg` program of LibreDWG, when installed."""
    return shutil.which("dxf2dwg")


def dxf_to_dwg(dxf: bytes) -> bytes:
    """Converts with LibreDWG's `dxf2dwg`; raises RuntimeError when it is missing or fails."""
    program = dwg_converter()
    if program is None:
        raise RuntimeError("dxf2dwg is not installed")
    with tempfile.TemporaryDirectory() as folder:
        source = Path(folder) / "plan.dxf"
        target = Path(folder) / "plan.dwg"
        source.write_bytes(dxf)
        result = subprocess.run(
            [program, "-y", "-o", str(target), str(source)],
            capture_output=True,
            timeout=60,
        )
        if result.returncode != 0 or not target.exists():
            raise RuntimeError("dxf2dwg failed")
        return target.read_bytes()
