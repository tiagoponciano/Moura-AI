import { describe, expect, it } from "vitest";
import {
  driveDownloadUrl,
  extractDriveFileIds,
  googleDocUrls,
  parseGoogleLink,
} from "./links";

const DOC_ID = "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs";
const DRIVE_ID = "1i49XREJGx18LguOTS-UrozxP_D0LCQmw";

describe("parseGoogleLink", () => {
  it("recognizes a Google Docs edit link with a query string", () => {
    expect(
      parseGoogleLink(
        `https://docs.google.com/document/d/${DOC_ID}/edit?usp=sharing`,
      ),
    ).toEqual({ kind: "doc", id: DOC_ID });
  });

  it("recognizes a Google Drive file view link", () => {
    expect(
      parseGoogleLink(
        `https://drive.google.com/file/d/${DRIVE_ID}/view?usp=drive_link`,
      ),
    ).toEqual({ kind: "drive-file", id: DRIVE_ID });
  });

  it("ignores surrounding whitespace", () => {
    expect(
      parseGoogleLink(`  https://docs.google.com/document/d/${DOC_ID}  `),
    ).toEqual({
      kind: "doc",
      id: DOC_ID,
    });
  });

  it("rejects Google Sheets links", () => {
    expect(
      parseGoogleLink(`https://docs.google.com/spreadsheets/d/${DOC_ID}/edit`),
    ).toBeUndefined();
  });

  it("rejects other hosts and plain http", () => {
    expect(
      parseGoogleLink(`https://example.com/document/d/${DOC_ID}`),
    ).toBeUndefined();
    expect(
      parseGoogleLink(`http://docs.google.com/document/d/${DOC_ID}`),
    ).toBeUndefined();
  });

  it("rejects text that is not a URL", () => {
    expect(parseGoogleLink("IN 1 anexo D")).toBeUndefined();
  });
});

describe("googleDocUrls", () => {
  it("builds the preview, docx export and edit URLs", () => {
    expect(googleDocUrls(DOC_ID)).toEqual({
      preview: `https://docs.google.com/document/d/${DOC_ID}/preview`,
      export: `https://docs.google.com/document/d/${DOC_ID}/export?format=docx`,
      edit: `https://docs.google.com/document/d/${DOC_ID}/edit`,
    });
  });
});

describe("driveDownloadUrl", () => {
  it("builds the direct download URL that skips the virus-scan page", () => {
    expect(driveDownloadUrl(DRIVE_ID)).toBe(
      `https://drive.usercontent.google.com/download?id=${DRIVE_ID}&export=download&confirm=t`,
    );
  });
});

describe("extractDriveFileIds", () => {
  it("reads each linked Drive file once", () => {
    const link = `<a href="https://drive.google.com/file/d/${DRIVE_ID}/view?usp=sharing">clique aqui</a>`;
    expect(extractDriveFileIds(`<li>${link}</li><li>${link}</li>`)).toEqual([
      DRIVE_ID,
    ]);
  });

  it("returns nothing for a page without Drive links", () => {
    expect(
      extractDriveFileIds('<a href="https://cbm.sc.gov.br">x</a>'),
    ).toEqual([]);
  });
});
