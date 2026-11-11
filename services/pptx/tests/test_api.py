import io

import pytest
from fastapi.testclient import TestClient
from pptx import Presentation

from app.main import app

client = TestClient(app)
AUTH = {"Authorization": "Bearer secret"}


@pytest.fixture(autouse=True)
def token(monkeypatch):
    monkeypatch.setenv("PPTX_SERVICE_TOKEN", "secret")


def test_health_needs_no_token():
    assert client.get("/health").json() == {"status": "ok"}


def test_render_returns_a_deck_with_the_values():
    response = client.post("/render", json={"client": "Padaria Silva"}, headers=AUTH)
    assert response.status_code == 200
    prs = Presentation(io.BytesIO(response.content))
    text = " ".join(
        shape.text_frame.text for slide in prs.slides for shape in slide.shapes if shape.has_text_frame
    )
    assert "Cliente: Padaria Silva" in text


def test_render_refuses_a_wrong_token():
    response = client.post("/render", json={}, headers={"Authorization": "Bearer nope"})
    assert response.status_code == 401


def test_render_refuses_a_missing_token():
    assert client.post("/render", json={}).status_code == 401


def test_render_is_unavailable_without_a_configured_token(monkeypatch):
    monkeypatch.delenv("PPTX_SERVICE_TOKEN")
    assert client.post("/render", json={}, headers=AUTH).status_code == 503


def test_render_refuses_an_unknown_value():
    response = client.post("/render", json={"other": "x"}, headers=AUTH)
    assert response.status_code == 422


def test_render_refuses_a_very_long_text():
    response = client.post("/render", json={"client": "x" * 201}, headers=AUTH)
    assert response.status_code == 422
