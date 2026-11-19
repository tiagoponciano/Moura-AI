#!/usr/bin/env bash
# Builds LibreDWG's dxf2dwg and dwgread as fully static, stripped programs into /out.
# Run inside a Debian container; see .github/workflows/dxf2dwg-static.yml.
set -euo pipefail

LIBREDWG_VERSION="${LIBREDWG_VERSION:-0.13.3}"

apt-get update
apt-get install -y --no-install-recommends build-essential curl xz-utils ca-certificates file python3

mkdir /build && cd /build
curl -fsSL "https://github.com/LibreDWG/libredwg/releases/download/${LIBREDWG_VERSION}/libredwg-${LIBREDWG_VERSION}.tar.xz" \
  | tar -xJ --strip-components=1

# `-all-static` is a libtool flag: gcc refuses it, so it goes to `make`, not to `configure`.
./configure --prefix=/opt/libredwg --disable-shared --enable-static \
  --disable-bindings --disable-werror
make -j"$(nproc)" LDFLAGS="-all-static"
make install

for program in dxf2dwg dwgread; do
  cp "/opt/libredwg/bin/${program}" "/out/${program}"
  strip --strip-all "/out/${program}"
done
echo "libredwg ${LIBREDWG_VERSION}" > /out/VERSION
