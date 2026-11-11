"""Photos and scans: clean the image, find the straight strokes and merge them into lines."""

import math

import cv2
import numpy as np

from .geometry import Line, Plan

BLUR_LIMIT = 60.0
CONTRAST_LIMIT = 25.0
MIN_SIDE_PX = 1000


def quality_warnings(gray: np.ndarray) -> list[str]:
    """Why the result may not be reliable: `blurry`, `low_contrast`, `low_resolution`."""
    warnings = []
    if cv2.Laplacian(gray, cv2.CV_64F).var() < BLUR_LIMIT:
        warnings.append("blurry")
    if float(gray.std()) < CONTRAST_LIMIT:
        warnings.append("low_contrast")
    if min(gray.shape) < MIN_SIDE_PX:
        warnings.append("low_resolution")
    return warnings


def deskew(gray: np.ndarray) -> np.ndarray:
    """Rotates a slightly tilted image so the main strokes are horizontal and vertical."""
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(
        edges, 1, np.pi / 180, 100, minLineLength=gray.shape[1] // 8, maxLineGap=10
    )
    if lines is None:
        return gray
    offsets = []
    for x1, y1, x2, y2 in lines.reshape(-1, 4):
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        offset = ((angle + 45) % 90) - 45  # distance from the nearest axis
        if abs(offset) <= 10:
            offsets.append(offset)
    if not offsets:
        return gray
    tilt = float(np.median(offsets))
    if abs(tilt) < 0.3:
        return gray
    h, w = gray.shape
    matrix = cv2.getRotationMatrix2D((w / 2, h / 2), tilt, 1.0)
    return cv2.warpAffine(gray, matrix, (w, h), borderValue=255)


def clean(gray: np.ndarray) -> np.ndarray:
    """Contrast, noise and binarization: ink is 255 on a black background."""
    gray = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)
    gray = cv2.fastNlMeansDenoising(gray, None, 10)
    return cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 15
    )


def _merge(lines: list[tuple[float, float, float, float]], tolerance: float):
    """Joins segments lying on the same horizontal or vertical axis that touch or overlap."""
    merged: list[tuple[float, float, float, float]] = []
    others = []
    groups: dict[tuple[str, int], list[tuple[float, float]]] = {}
    for x1, y1, x2, y2 in lines:
        if abs(y1 - y2) <= tolerance:
            key = ("h", round((y1 + y2) / 2 / tolerance))
            groups.setdefault(key, []).append((min(x1, x2), max(x1, x2)))
        elif abs(x1 - x2) <= tolerance:
            key = ("v", round((x1 + x2) / 2 / tolerance))
            groups.setdefault(key, []).append((min(y1, y2), max(y1, y2)))
        else:
            others.append((x1, y1, x2, y2))
    for (axis, bucket), spans in groups.items():
        fixed = bucket * tolerance
        spans.sort()
        start, end = spans[0]
        for a, b in spans[1:]:
            if a <= end + tolerance * 3:
                end = max(end, b)
            else:
                merged.append(_segment(axis, fixed, start, end))
                start, end = a, b
        merged.append(_segment(axis, fixed, start, end))
    return merged + others


def _segment(axis: str, fixed: float, start: float, end: float):
    return (start, fixed, end, fixed) if axis == "h" else (fixed, start, fixed, end)


def read_image(image: np.ndarray, dpi: int) -> Plan:
    """The straight strokes of a photo or scan as lines in millimeters on paper."""
    gray = image if image.ndim == 2 else cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape
    plan = Plan(
        width=width * 25.4 / dpi,
        height=height * 25.4 / dpi,
        warnings=quality_warnings(gray),
    )
    ink = clean(deskew(gray))
    found = cv2.HoughLinesP(
        ink,
        1,
        np.pi / 180,
        threshold=80,
        minLineLength=max(30, width // 33),
        maxLineGap=8,
    )
    if found is None:
        plan.warnings.append("no_lines_found")
        return plan
    mm = 25.4 / dpi
    segments = _merge([tuple(map(float, row)) for row in found.reshape(-1, 4)], tolerance=4)
    for x1, y1, x2, y2 in segments:
        plan.lines.append(
            Line(x1 * mm, (height - y1) * mm, x2 * mm, (height - y2) * mm)
        )
    return plan
