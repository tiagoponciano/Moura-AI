import { createHash } from "node:crypto";
import PizZip from "pizzip";

const TEXT_RUN = /<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g;

/**
 * SHA-256 of a docx's body text, ignoring whitespace differences and how the
 * text is split into runs. Formatting changes do not alter it.
 */
export function docxTextHash(docx: Uint8Array): string {
  const xml = new PizZip(docx).file("word/document.xml")?.asText() ?? "";
  const text = [...xml.matchAll(TEXT_RUN)]
    .map((match) => match[1])
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(text).digest("hex");
}
