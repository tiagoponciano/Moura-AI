import "server-only";

const TIMEOUT_MS = 50_000;

/** Whether `PDF_SERVICE_URL` is set; without it only the `.docx` can be generated. */
export const isPdfServiceConfigured = () =>
  Boolean(process.env.PDF_SERVICE_URL);

/** Server-only. Converts a `.docx` in the PDF microservice; throws on any failure. */
export async function convertDocxToPdf(docx: Uint8Array): Promise<Uint8Array> {
  const credentials = Buffer.from(
    `${process.env.PDF_SERVICE_USER}:${process.env.PDF_SERVICE_PASSWORD}`,
  ).toString("base64");
  const form = new FormData();
  form.append("files", new Blob([docx.slice()]), "document.docx");

  const response = await fetch(
    `${process.env.PDF_SERVICE_URL}/forms/libreoffice/convert`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`The PDF service answered ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

/** Server-only. Prints an HTML page to PDF in the PDF microservice; throws on any failure. */
export async function convertHtmlToPdf(html: string): Promise<Uint8Array> {
  const credentials = Buffer.from(
    `${process.env.PDF_SERVICE_USER}:${process.env.PDF_SERVICE_PASSWORD}`,
  ).toString("base64");
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  form.append("paperWidth", "8.27");
  form.append("paperHeight", "11.7");

  const response = await fetch(
    `${process.env.PDF_SERVICE_URL}/forms/chromium/convert/html`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    throw new Error(`The PDF service answered ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}
