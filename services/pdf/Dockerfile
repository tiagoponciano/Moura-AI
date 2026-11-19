# Document conversion microservice: LibreOffice behind Gotenberg's HTTP API.
# The app sends it a rendered .docx and gets the PDF back; it has no AI, no
# storage and no database. Chromium prints our own HTML from
# an uploaded file; the allow list refuses every other URL.
# See client/features/documents/docs/document-generation.md.
FROM gotenberg/gotenberg:8.40.0

ENV PORT=3000

# Basic auth is on unless PDF_BASIC_AUTH=false. Behind Cloud Run the service is private and
# Google checks the caller, and Cloud Run reads `Authorization` as its own token, so the
# Basic header cannot be used there.
ENV PDF_BASIC_AUTH=true

CMD ["sh", "-c", "if [ \"$PDF_BASIC_AUTH\" = \"true\" ]; then AUTH=--api-enable-basic-auth; fi; exec gotenberg $AUTH --api-port-from-env=PORT --api-timeout=45s --api-disable-download-from '--chromium-allow-list=^file:///tmp/.*' --webhook-disable"]
