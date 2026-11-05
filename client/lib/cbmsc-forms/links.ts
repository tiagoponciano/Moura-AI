/** Google Docs and Drive ids: letters, digits, `_` and `-`. */
export const GOOGLE_ID_PATTERN = /^[\w-]{20,}$/;

export type GoogleLink =
  { kind: "doc"; id: string } | { kind: "drive-file"; id: string };

const DOC_PATH = /^\/document\/d\/([\w-]{20,})/;
const DRIVE_FILE_PATH = /^\/file\/d\/([\w-]{20,})/;

/** A Google Docs document link or a Google Drive file link; `undefined` for anything else. */
export function parseGoogleLink(input: string): GoogleLink | undefined {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  if (url.hostname === "docs.google.com") {
    const id = DOC_PATH.exec(url.pathname)?.[1];
    return id ? { kind: "doc", id } : undefined;
  }
  if (url.hostname === "drive.google.com") {
    const id = DRIVE_FILE_PATH.exec(url.pathname)?.[1];
    return id ? { kind: "drive-file", id } : undefined;
  }
  return undefined;
}

/** Public URLs of a Google Doc; each one serves the version current at request time. */
export function googleDocUrls(id: string) {
  const base = `https://docs.google.com/document/d/${id}`;
  return {
    preview: `${base}/preview`,
    export: `${base}/export?format=docx`,
    edit: `${base}/edit`,
  };
}

/** Direct download of a public Drive file; `confirm=t` skips the virus-scan page. */
export const driveDownloadUrl = (id: string) =>
  `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`;
