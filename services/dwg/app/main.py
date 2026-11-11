"""DWG service: turns a plan (a vector PDF, a scanned PDF or an image) into a DXF or DWG.

No AI, no storage and no database. For what code cannot read it returns small
crops, so a model never needs the whole plan.
"""

import hmac
import os
from typing import Literal

import cv2
import numpy as np
import pymupdf
from fastapi import FastAPI, File, Header, HTTPException, Query, Response, UploadFile

from .crops import crop_regions
from .dxf import dwg_converter, dxf_to_dwg, to_dxf
from .geometry import scaled
from .raster import read_image
from .vector import read_vector_pdf

MAX_BYTES = 20 * 1024 * 1024
RASTER_DPI = 200

app = FastAPI(title="Moura DWG service", docs_url=None, redoc_url=None)


def check_token(authorization: str | None) -> None:
    token = os.environ.get("DWG_SERVICE_TOKEN")
    if not token:
        raise HTTPException(503, "DWG_SERVICE_TOKEN is not configured")
    if not authorization or not hmac.compare_digest(authorization, f"Bearer {token}"):
        raise HTTPException(401, "Invalid token")


async def read_upload(file: UploadFile) -> bytes:
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "The file is over 20 MB")
    if not data:
        raise HTTPException(422, "The file is empty")
    return data


def decode_image(data: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(422, "Unsupported file: send a PDF, JPEG or PNG")
    return image


def rasterize_pdf(data: bytes) -> np.ndarray:
    try:
        with pymupdf.open(stream=data, filetype="pdf") as document:
            pixmap = document[0].get_pixmap(dpi=RASTER_DPI, colorspace=pymupdf.csRGB)
    except Exception as cause:
        raise HTTPException(422, "Unsupported file: send a PDF, JPEG or PNG") from cause
    image = np.frombuffer(pixmap.samples, np.uint8).reshape(pixmap.h, pixmap.w, 3)
    return cv2.cvtColor(image, cv2.COLOR_RGB2BGR)


def is_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


@app.get("/health")
def health() -> dict[str, object]:
    return {"status": "ok", "dwg": dwg_converter() is not None}


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    format: Literal["dxf", "dwg"] = Query("dxf"),
    scale: int = Query(1, ge=1, le=5000),
    authorization: str | None = Header(default=None),
) -> Response:
    """The plan as DXF or DWG. `scale` is the drawing's scale denominator (100 for 1:100), applied to every coordinate. `X-Mode` is `vector` or `raster`; `X-Warnings` lists quality problems."""
    check_token(authorization)
    data = await read_upload(file)

    plan = None
    mode = "raster"
    if is_pdf(data):
        try:
            plan = read_vector_pdf(data)
        except Exception as cause:
            raise HTTPException(422, "Unsupported file: send a PDF, JPEG or PNG") from cause
        if plan is not None:
            mode = "vector"
        image = None if plan else rasterize_pdf(data)
    else:
        image = decode_image(data)
    if plan is None:
        plan = read_image(image, RASTER_DPI)

    dxf = to_dxf(scaled(plan, scale) if scale != 1 else plan)
    if format == "dwg":
        if dwg_converter() is None:
            raise HTTPException(501, "DWG conversion is not available on this service")
        try:
            body, media = dxf_to_dwg(dxf), "application/acad"
        except RuntimeError as cause:
            raise HTTPException(502, "DWG conversion failed") from cause
    else:
        body, media = dxf, "application/dxf"
    return Response(
        content=body,
        media_type=media,
        headers={
            "X-Mode": mode,
            "X-Warnings": ",".join(plan.warnings),
            "Content-Disposition": f'attachment; filename="planta.{format}"',
        },
    )


@app.post("/crops")
async def crops(
    file: UploadFile = File(...), authorization: str | None = Header(default=None)
) -> dict[str, list[dict[str, str]]]:
    """Small PNG crops of the title block and the scale strip, for a model to read."""
    check_token(authorization)
    data = await read_upload(file)
    image = rasterize_pdf(data) if is_pdf(data) else decode_image(data)
    return {"crops": crop_regions(image)}
