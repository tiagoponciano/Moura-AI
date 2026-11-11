"""PPTX microservice: fills Moura's proposal template and returns the .pptx.

No AI, no storage and no database; it only receives values and returns a file.
"""

import hmac
import io
import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, Response
from pptx import Presentation

from .fill import fill
from .proposal import ProposalValues, tag_values

TEMPLATE = Path(__file__).resolve().parent.parent / "templates" / "proposal.pptx"
PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"

app = FastAPI(title="Moura PPTX service", docs_url=None, redoc_url=None)


def check_token(authorization: str | None) -> None:
    token = os.environ.get("PPTX_SERVICE_TOKEN")
    if not token:
        raise HTTPException(503, "PPTX_SERVICE_TOKEN is not configured")
    expected = f"Bearer {token}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(401, "Invalid token")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/render")
def render(
    values: ProposalValues, authorization: str | None = Header(default=None)
) -> Response:
    check_token(authorization)
    prs = Presentation(str(TEMPLATE))
    fill(prs, tag_values(values))
    out = io.BytesIO()
    prs.save(out)
    return Response(
        content=out.getvalue(),
        media_type=PPTX_MIME,
        headers={"Content-Disposition": 'attachment; filename="proposta.pptx"'},
    )
