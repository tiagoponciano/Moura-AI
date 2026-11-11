"""Small crops of the regions a model can read cheaply, so it never sees the whole plan."""

import base64

import cv2
import numpy as np

MAX_SIDE = 800

# (name, left, top, right, bottom) as fractions of the page.
REGIONS = [
    ("title_block", 0.62, 0.70, 1.0, 1.0),
    ("scale_strip", 0.0, 0.88, 0.62, 1.0),
]


def crop_regions(image: np.ndarray) -> list[dict[str, str]]:
    """PNG crops (base64) of the title block and of the strip where a scale bar usually sits."""
    height, width = image.shape[:2]
    crops = []
    for name, left, top, right, bottom in REGIONS:
        part = image[
            int(top * height) : int(bottom * height),
            int(left * width) : int(right * width),
        ]
        if part.size == 0:
            continue
        longest = max(part.shape[:2])
        if longest > MAX_SIDE:
            ratio = MAX_SIDE / longest
            part = cv2.resize(part, None, fx=ratio, fy=ratio, interpolation=cv2.INTER_AREA)
        ok, png = cv2.imencode(".png", part)
        if ok:
            crops.append({"name": name, "png_base64": base64.b64encode(png).decode()})
    return crops
