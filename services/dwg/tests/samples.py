"""Synthetic plans: no real plan is committed, so these stand in for them."""

import cv2
import numpy as np
import pymupdf


def vector_pdf() -> bytes:
    """A CAD-like page: a 400 x 300 pt room with an inner wall, and a label."""
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)
    shape = page.new_shape()
    shape.draw_rect(pymupdf.Rect(100, 100, 500, 400))
    shape.draw_line((300, 100), (300, 400))
    for i in range(25):  # enough strokes to count as a CAD export
        shape.draw_line((100, 120 + i * 10), (140, 120 + i * 10))
    shape.finish(width=1)
    shape.commit()
    page.insert_text((120, 80), "SALA 01", fontsize=12)
    return doc.tobytes()


def room_image(tilt: float = 0.0) -> np.ndarray:
    """A 1600 x 1200 white page with a 1000 x 700 px room and an inner wall."""
    image = np.full((1200, 1600), 255, np.uint8)
    cv2.rectangle(image, (300, 250), (1300, 950), 0, 4)
    cv2.line(image, (800, 250), (800, 950), 0, 4)
    if tilt:
        matrix = cv2.getRotationMatrix2D((800, 600), tilt, 1.0)
        image = cv2.warpAffine(image, matrix, (1600, 1200), borderValue=255)
    return image


def png(image: np.ndarray) -> bytes:
    ok, data = cv2.imencode(".png", image)
    assert ok
    return data.tobytes()
