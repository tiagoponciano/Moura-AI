"""Plans exported from CAD as vector PDFs: the strokes are read directly, nothing is traced."""

import pymupdf

from .geometry import PT_TO_MM, Line, Plan, Text

BEZIER_STEPS = 6
# A page with fewer strokes than this is a scan or a photo inside a PDF.
MIN_VECTOR_STROKES = 20


def _bezier(p0, p1, p2, p3):
    points = []
    for step in range(BEZIER_STEPS + 1):
        t = step / BEZIER_STEPS
        mt = 1 - t
        points.append(
            (
                mt**3 * p0.x + 3 * mt**2 * t * p1.x + 3 * mt * t**2 * p2.x + t**3 * p3.x,
                mt**3 * p0.y + 3 * mt**2 * t * p1.y + 3 * mt * t**2 * p2.y + t**3 * p3.y,
            )
        )
    return points


def read_vector_pdf(pdf: bytes, page_number: int = 0) -> Plan | None:
    """The page's lines and texts, or None when it holds too few strokes to be a CAD export."""
    with pymupdf.open(stream=pdf, filetype="pdf") as document:
        page = document[page_number]
        height = page.rect.height

        def point(x: float, y: float) -> tuple[float, float]:
            return (x * PT_TO_MM, (height - y) * PT_TO_MM)

        plan = Plan(width=page.rect.width * PT_TO_MM, height=height * PT_TO_MM)
        strokes = 0
        for drawing in page.get_drawings():
            for item in drawing["items"]:
                kind = item[0]
                if kind == "l":
                    pairs = [(item[1], item[2])]
                elif kind == "re":
                    r = item[1]
                    corners = [r.tl, r.tr, r.br, r.bl, r.tl]
                    pairs = list(zip(corners, corners[1:]))
                elif kind == "qu":
                    q = item[1]
                    corners = [q.ul, q.ur, q.lr, q.ll, q.ul]
                    pairs = list(zip(corners, corners[1:]))
                elif kind == "c":
                    curve = _bezier(*item[1:5])
                    pairs = [
                        (pymupdf.Point(a), pymupdf.Point(b))
                        for a, b in zip(curve, curve[1:])
                    ]
                else:
                    continue
                for a, b in pairs:
                    strokes += 1
                    x1, y1 = point(a.x, a.y)
                    x2, y2 = point(b.x, b.y)
                    if (x1, y1) != (x2, y2):
                        plan.lines.append(Line(x1, y1, x2, y2))
        if strokes < MIN_VECTOR_STROKES:
            return None

        for block in page.get_text("dict")["blocks"]:
            for text_line in block.get("lines", []):
                for span in text_line["spans"]:
                    value = span["text"].strip()
                    if value:
                        x, y = point(*span["origin"])
                        plan.texts.append(Text(x, y, span["size"] * PT_TO_MM, value))
        return plan
