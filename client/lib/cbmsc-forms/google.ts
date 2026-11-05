import "server-only";
import { docxTextHash } from "./doc-text";
import {
  CBMSC_FORMS_PAGE,
  driveDownloadUrl,
  extractDriveFileIds,
  googleDocUrls,
  type GoogleLink,
} from "./links";
import { extractGoogleDocIds } from "./pdf-links";
import { titleFromContentDisposition } from "./title";

const TIMEOUT_MS = 15_000;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

const get = (url: string) =>
  fetch(url, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });

/**
 * Server-only. The Google Doc's title, read from the file name of its docx
 * export. A private doc redirects to Google's login page, which has no file
 * name, so it throws like a missing one.
 */
export async function fetchGoogleDocTitle(id: string): Promise<string> {
  const response = await get(googleDocUrls(id).export);
  await response.body?.cancel();
  if (!response.ok) {
    throw new Error(`Google Doc ${id} answered ${response.status}`);
  }
  const title = titleFromContentDisposition(
    response.headers.get("content-disposition"),
  );
  if (!title) throw new Error(`Google Doc ${id} is not public`);
  return title;
}

/** Server-only. The text hash of the Google Doc's current docx export. */
export async function fetchGoogleDocTextHash(id: string): Promise<string> {
  const response = await get(googleDocUrls(id).export);
  if (!response.ok) {
    throw new Error(`Google Doc ${id} answered ${response.status}`);
  }
  if (!response.headers.get("content-disposition")) {
    throw new Error(`Google Doc ${id} is not public`);
  }
  return docxTextHash(new Uint8Array(await response.arrayBuffer()));
}

async function fetchDrivePdf(id: string): Promise<Uint8Array> {
  const response = await get(driveDownloadUrl(id));
  if (!response.ok) {
    throw new Error(`Drive file ${id} answered ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_PDF_BYTES) {
    throw new Error(`Drive file ${id} is larger than ${MAX_PDF_BYTES} bytes`);
  }
  if (Buffer.from(bytes.subarray(0, 5)).toString("latin1") !== "%PDF-") {
    throw new Error(`Drive file ${id} is not a PDF`);
  }
  return bytes;
}

/** Server-only. The Drive files linked from the CBMSC forms page. */
export async function fetchCbmscDriveFileIds(): Promise<string[]> {
  const response = await get(CBMSC_FORMS_PAGE);
  if (!response.ok) {
    throw new Error(`The CBMSC page answered ${response.status}`);
  }
  return extractDriveFileIds(await response.text());
}

/** Server-only. The Google Doc itself, or every Google Doc linked from a Drive PDF. */
export async function resolveGoogleDocIds(link: GoogleLink): Promise<string[]> {
  if (link.kind === "doc") return [link.id];
  return extractGoogleDocIds(await fetchDrivePdf(link.id));
}
