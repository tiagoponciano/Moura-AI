# Plan conversion microservice: a plan (vector PDF, scanned PDF or image) in,
# a DXF or DWG out. It has no AI, no storage and no database. See client/docs/dwg-service.md.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /srv

# libredwg-tools provides dxf2dwg; without it the service still answers DXF.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libredwg-tools libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app

RUN useradd --system --no-create-home service
USER service

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
