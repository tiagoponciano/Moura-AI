# Document conversion microservice: LibreOffice behind Gotenberg's HTTP API.
# The app sends it a rendered .docx and gets the PDF back; it has no AI, no
# storage and no database. Chromium prints our own HTML (the PPCI report) from
# an uploaded file; the allow list refuses every other URL.
# See client/features/documents/docs/document-generation.md.
FROM gotenberg/gotenberg:8.40.0

ENV PORT=3000

CMD ["gotenberg", \
  "--api-enable-basic-auth", \
  "--api-port-from-env=PORT", \
  "--api-timeout=45s", \
  "--api-disable-download-from", \
  "--chromium-allow-list=^file:///tmp/.*", \
  "--webhook-disable"]
