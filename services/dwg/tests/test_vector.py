import ezdxf
import pytest

from app.dxf import to_dxf
from app.geometry import PT_TO_MM
from app.vector import read_vector_pdf

from .samples import vector_pdf


def test_a_cad_pdf_keeps_its_strokes_and_measures():
    plan = read_vector_pdf(vector_pdf())
    assert plan is not None
    widths = [abs(line.x2 - line.x1) for line in plan.lines if line.y1 == line.y2]
    assert max(widths) == pytest.approx((500 - 100) * PT_TO_MM)


def test_the_page_is_flipped_so_y_goes_up():
    plan = read_vector_pdf(vector_pdf())
    top_wall = max(plan.lines, key=lambda line: line.y1 if line.y1 == line.y2 else -1)
    assert round(top_wall.y1 / PT_TO_MM) == 842 - 100


def test_the_texts_are_read_with_their_position():
    plan = read_vector_pdf(vector_pdf())
    assert [text.value for text in plan.texts] == ["SALA 01"]


def test_a_page_with_few_strokes_is_not_a_cad_export():
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    page.draw_line((10, 10), (100, 10))
    assert read_vector_pdf(doc.tobytes()) is None


def test_the_dxf_holds_the_lines_and_the_text_in_millimeters():
    plan = read_vector_pdf(vector_pdf())
    import io

    doc = ezdxf.read(io.StringIO(to_dxf(plan).decode()))
    kinds = [entity.dxftype() for entity in doc.modelspace()]
    assert kinds.count("LINE") == len(plan.lines)
    assert kinds.count("TEXT") == 1
    assert doc.units == ezdxf.units.MM
