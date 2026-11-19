# Plan conversion microservice: a plan (vector PDF, scanned PDF or image) in,
# a DXF or DWG out. It has no AI, no storage and no database. See client/docs/dwg-service.md.

# Stage 1: LibreDWG, built from the release. Debian 13 has no package with
# dxf2dwg. Linked statically, so the final image copies a single program.
FROM python:3.13-slim AS libredwg
ARG LIBREDWG_VERSION=0.13.3
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential curl xz-utils ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /build
RUN curl -fsSL "https://github.com/LibreDWG/libredwg/releases/download/${LIBREDWG_VERSION}/libredwg-${LIBREDWG_VERSION}.tar.xz" \
  | tar -xJ --strip-components=1 \
  && ./configure --prefix=/opt/libredwg --disable-shared --enable-static \
     --disable-bindings --disable-docs --disable-werror \
  && make -j"$(nproc)" \
  && make install

# Stage 2: the service.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
WORKDIR /srv

RUN apt-get update \
  && apt-get install -y --no-install-recommends libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=libredwg /opt/libredwg/bin/dxf2dwg /opt/libredwg/bin/dwgread /usr/local/bin/

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app app

RUN useradd --system --no-create-home service
USER service

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
