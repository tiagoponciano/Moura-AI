import { inflateSync } from "node:zlib";

const URI_PATTERN = /\/URI\s*\(([^)]*)\)/g;
const STREAM_PATTERN = /stream\r?\n([\s\S]*?)endstream/g;
const DOC_ID_IN_URI = /docs\.google\.com\/document\/d\/([\w-]{20,})/;

const findUris = (text: string) =>
  [...text.matchAll(URI_PATTERN)].map((match) => match[1]);

/**
 * Google Docs ids linked from a PDF, without repeats: plain objects first,
 * then Flate-compressed streams. URIs containing `)` are not supported.
 */
export function extractGoogleDocIds(pdf: Uint8Array): string[] {
  const raw = Buffer.from(pdf).toString("latin1");
  const uris = findUris(raw);
  for (const match of raw.matchAll(STREAM_PATTERN)) {
    try {
      const inflated = inflateSync(Buffer.from(match[1], "latin1"));
      uris.push(...findUris(inflated.toString("latin1")));
    } catch {
      // Not a Flate stream (images, fonts in other encodings).
    }
  }
  const ids = uris
    .map((uri) => DOC_ID_IN_URI.exec(uri)?.[1])
    .filter((id): id is string => id !== undefined);
  return [...new Set(ids)];
}
