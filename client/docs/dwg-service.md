# DWG service

How a plan becomes a DXF or DWG. For developers operating or extending `services/dwg`. Describes the code as it is now.

## What this is

A Python service (FastAPI, PyMuPDF, OpenCV and ezdxf) that reads a floor plan and returns a drawing file. The heavy work is code, with no model: the service reads the strokes and texts of a vector PDF directly, and traces the straight strokes of a photo or a scan. For what code cannot read (the title block, the scale bar), `/crops` returns small images, so a model never sees the whole plan. That is the token saving.

Invariants:

- The service never calls a model, stores a file or keeps state.
- Output is on paper by default: millimeters, y up, scale 1:1 of the page. The drawing's real-world scale (1:100…) is applied only when the caller sends it as `scale`; it has to be read from the plan by the caller.
- Quality problems are reported, never hidden: a photo that cannot give a reliable result comes back with warnings.

## Surface

All routes except `/health` need `Authorization: Bearer $DWG_SERVICE_TOKEN`; `401` for a wrong or missing token, `503` when the service has no token configured. Files are limited to 20 MB (`413`), an empty or unreadable file is `422`.

| Method | Path       | Takes                                                                     | Returns                                                                                   |
| ------ | ---------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET`  | `/health`  | none                                                                      | `{ status: "ok", dwg: boolean }`; `dwg` tells whether the DWG converter is installed      |
| `POST` | `/convert` | multipart `file`; query `format=dxf\|dwg`, `scale` (1 to 5000, default 1) | The drawing. Headers `X-Mode` (`vector` or `raster`) and `X-Warnings` (comma separated)   |
| `POST` | `/crops`   | multipart `file`                                                          | `{ crops: [{ name, png_base64 }] }`: `title_block` and `scale_strip`, each at most 800 px |

`format=dwg` answers `501` when `dxf2dwg` is not installed and `502` when it fails.

## Rules and behavior

1. A PDF is read as vector first (`vector.py`): lines, rectangles, quads and curves (as 6 segments) become lines, text spans become texts, the page is flipped so y goes up. A page with fewer than 20 strokes is not a CAD export and goes to the raster path.
2. The raster path (`raster.py`) renders a PDF at 200 dpi or reads the image (taken as 200 dpi), straightens it when the main strokes are tilted by 0.3° to 10°, improves contrast, removes noise, binarizes, finds straight strokes with a Hough transform and merges those on the same horizontal or vertical axis. Strokes that are neither, are kept as they are.
3. Warnings (`X-Warnings`): `blurry` (Laplacian variance under 60), `low_contrast` (standard deviation under 25), `low_resolution` (shorter side under 1000 px), `no_lines_found`.
4. The DXF (R2010, units mm) has layer `LINHAS` for lines and `TEXTO` for texts. Curves of a raster are not traced and raster texts are not read.
5. `/crops` takes the bottom-right 38 % × 30 % (title block) and the bottom-left strip 62 % × 12 % (scale bar), each scaled down to at most 800 px.

## What this does NOT do

- No OCR: texts of a photo or scan are not recognized. Only vector PDFs carry texts.
- No layers by meaning (walls, doors, furniture), no blocks and no arcs for door swings: everything drawn is `LINHAS`.
- No scale reading: coordinates are paper millimeters unless the caller sends `scale`, the drawing's scale denominator (100 for 1:100), which multiplies every coordinate and text height. Reading the scale from the plan is the caller's job.
- Regions of `/crops` are fixed fractions of the page; a plan with its title block elsewhere needs other regions.
- DWG is only as good as LibreDWG's `dxf2dwg`, which is experimental; the DXF is the reliable output.
- The thresholds were chosen on synthetic plans; no real Moura plan has been used yet.

## Gotchas

- Every wall shows twice in the result → a drawn wall has two parallel edges and both are traced → expected; merging them into one center line is not done.
- A photo gives few lines → the stroke is thin or faint and the binarization drops it → check `X-Warnings`; a scan at 200 dpi or more works best.
- `dwg: false` in `/health` → the image was built without `libredwg-tools`, or the program has another name → use DXF, which AutoCAD and others open.

## Setup

- Local: `docker compose up -d dwg` serves it on `127.0.0.1:3003` with token `local-only`.
- Tests: from `services/dwg`, `pip install -r requirements-dev.txt` and `python -m pytest`; CI runs them in the `dwg-service` job.
- Production: deploy the image with `DWG_SERVICE_TOKEN` set.
