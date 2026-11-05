export type ParsedFormTitle = {
  normative: number | null;
  annex: string | null;
  name: string;
};

const TITLE_PATTERN =
  /^IN\s*(\d+)\s*[-–]\s*Anexo\s+([A-Z]{1,2})\s*[-–]\s*(.+)$/i;

/** Reads "IN 1 - Anexo D - <name>"; titles in any other shape keep only the name. */
export function parseFormTitle(title: string): ParsedFormTitle {
  const clean = title
    .replace(/\.docx$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = TITLE_PATTERN.exec(clean);
  if (!match) return { normative: null, annex: null, name: clean };
  return {
    normative: Number(match[1]),
    annex: match[2].toUpperCase(),
    name: match[3].trim(),
  };
}

/** The file name in a `Content-Disposition` header, UTF-8 form first. */
export function titleFromContentDisposition(
  header: string | null,
): string | undefined {
  if (!header) return undefined;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded) return decodeURIComponent(encoded.trim());
  return /filename="([^"]+)"/i.exec(header)?.[1];
}
