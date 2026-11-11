import io

import ezdxf
import pytest
from fastapi.testclient import TestClient

from app import main

from .samples import png, room_image, vector_pdf

client = TestClient(main.app)
AUTH = {"Authorization": "Bearer secret"}


@pytest.fixture(autouse=True)
def token(monkeypatch):
    monkeypatch.setenv("DWG_SERVICE_TOKEN", "secret")


def upload(data: bytes, name: str = "planta.pdf"):
    return {"file": (name, data)}


def test_a_cad_pdf_converts_in_vector_mode():
    response = client.post("/convert", files=upload(vector_pdf()), headers=AUTH)
    assert response.status_code == 200
    assert response.headers["x-mode"] == "vector"
    doc = ezdxf.read(io.StringIO(response.text))
    assert len(doc.modelspace()) > 10


def test_an_image_converts_in_raster_mode_and_reports_warnings():
    response = client.post(
        "/convert", files=upload(png(room_image()), "foto.png"), headers=AUTH
    )
    assert response.status_code == 200
    assert response.headers["x-mode"] == "raster"
    assert response.headers["x-warnings"] == ""


def test_a_scanned_pdf_goes_through_the_raster_path():
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page(width=1600 * 72 / 200, height=1200 * 72 / 200)
    page.insert_image(page.rect, stream=png(room_image()))
    response = client.post("/convert", files=upload(doc.tobytes()), headers=AUTH)
    assert response.status_code == 200
    assert response.headers["x-mode"] == "raster"


def test_dwg_is_not_implemented_without_the_converter(monkeypatch):
    monkeypatch.setattr(main, "dwg_converter", lambda: None)
    response = client.post("/convert?format=dwg", files=upload(vector_pdf()), headers=AUTH)
    assert response.status_code == 501


def test_an_unsupported_file_is_refused():
    response = client.post("/convert", files=upload(b"not a plan", "x.txt"), headers=AUTH)
    assert response.status_code == 422


def test_an_empty_file_is_refused():
    assert client.post("/convert", files=upload(b""), headers=AUTH).status_code == 422


def test_a_file_over_20_mb_is_refused():
    big = b"%PDF-" + b"0" * (20 * 1024 * 1024)
    assert client.post("/convert", files=upload(big), headers=AUTH).status_code == 413


def test_crops_returns_the_two_regions():
    response = client.post("/crops", files=upload(png(room_image()), "foto.png"), headers=AUTH)
    assert [c["name"] for c in response.json()["crops"]] == ["title_block", "scale_strip"]


def test_a_wrong_or_missing_token_is_refused():
    assert client.post("/convert", files=upload(vector_pdf())).status_code == 401
    wrong = {"Authorization": "Bearer no"}
    assert client.post("/convert", files=upload(vector_pdf()), headers=wrong).status_code == 401


def test_it_is_unavailable_without_a_configured_token(monkeypatch):
    monkeypatch.delenv("DWG_SERVICE_TOKEN")
    assert client.post("/convert", files=upload(vector_pdf()), headers=AUTH).status_code == 503


def test_health_says_whether_dwg_is_available(monkeypatch):
    monkeypatch.setattr(main, "dwg_converter", lambda: None)
    assert client.get("/health").json() == {"status": "ok", "dwg": False}
