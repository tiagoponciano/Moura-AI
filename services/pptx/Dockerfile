# Proposal microservice: fills Moura's .pptx template with the values it
# receives. It has no AI, no storage and no database. See client/docs/pptx-service.md.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /srv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app
COPY templates templates

RUN useradd --system --no-create-home service
USER service

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
