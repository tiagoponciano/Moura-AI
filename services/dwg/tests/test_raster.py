import cv2
import numpy as np

from app.crops import crop_regions
from app.raster import deskew, quality_warnings, read_image

from .samples import room_image

DPI = 200
MM = 25.4 / DPI


def near(value: float, target: float, tolerance: float = 12) -> bool:
    return abs(value - target) <= tolerance


def test_the_walls_of_a_room_become_long_horizontal_and_vertical_lines():
    plan = read_image(room_image(), DPI)
    horizontal = [l for l in plan.lines if near(l.y1, l.y2, 1) and abs(l.x2 - l.x1) > 900 * MM]
    vertical = [l for l in plan.lines if near(l.x1, l.x2, 1) and abs(l.y2 - l.y1) > 600 * MM]
    assert len(horizontal) >= 2
    assert len(vertical) >= 3


def test_a_tilted_photo_is_straightened_before_tracing():
    tilted = room_image(tilt=2.0)
    straight = deskew(tilted)
    plan = read_image(straight, DPI)
    long_horizontals = [l for l in plan.lines if near(l.y1, l.y2, 0.6) and abs(l.x2 - l.x1) > 900 * MM]
    assert len(long_horizontals) >= 2


def test_a_sharp_high_contrast_page_has_no_warning():
    assert quality_warnings(room_image()) == []


def test_a_blurred_page_is_flagged():
    blurred = cv2.GaussianBlur(room_image(), (0, 0), 12)
    assert "blurry" in quality_warnings(blurred)


def test_a_faded_page_is_flagged_for_contrast():
    faded = (room_image().astype(np.float32) * 0.05 + 230).astype(np.uint8)
    assert "low_contrast" in quality_warnings(faded)


def test_a_small_image_is_flagged_for_resolution():
    small = cv2.resize(room_image(), (400, 300))
    assert "low_resolution" in quality_warnings(small)


def test_a_blank_page_reports_that_no_lines_were_found():
    blank = np.full((1200, 1600), 255, np.uint8)
    assert "no_lines_found" in read_image(blank, DPI).warnings


def test_crops_are_small_pngs_of_the_title_block_and_the_scale_strip():
    crops = crop_regions(cv2.cvtColor(room_image(), cv2.COLOR_GRAY2BGR))
    assert [c["name"] for c in crops] == ["title_block", "scale_strip"]
    assert all(len(c["png_base64"]) > 0 for c in crops)


def test_a_crop_never_passes_800_pixels():
    import base64

    big = np.full((4000, 6000, 3), 255, np.uint8)
    for crop in crop_regions(big):
        decoded = cv2.imdecode(np.frombuffer(base64.b64decode(crop["png_base64"]), np.uint8), 1)
        assert max(decoded.shape[:2]) <= 800
