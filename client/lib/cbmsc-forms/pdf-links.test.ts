import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { extractGoogleDocIds } from "./pdf-links";

const A = "1JoCbd1zYEfTBX2OX_OlelX95i35UTbvwpCjy1pogVks";
const B = "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs";

const latin1 = (text: string) => Buffer.from(text, "latin1");

const annotation = (uri: string) =>
  `<</Type /Annot\n/Subtype /Link\n/A <</Type /Action\n/S /URI\n/URI (${uri})>>>>\n`;

function pdf(...parts: Buffer[]): Uint8Array {
  return new Uint8Array(Buffer.concat([latin1("%PDF-1.4\n"), ...parts]));
}

const compressedStream = (content: string) =>
  Buffer.concat([
    latin1("5 0 obj\n<</Filter /FlateDecode>>\nstream\n"),
    deflateSync(latin1(content)),
    latin1("\nendstream\nendobj\n"),
  ]);

describe("extractGoogleDocIds", () => {
  it("reads links from plain annotation objects", () => {
    const file = pdf(
      latin1(
        annotation(`https://docs.google.com/document/d/${A}/edit?usp=sharing`),
      ),
    );
    expect(extractGoogleDocIds(file)).toEqual([A]);
  });

  it("reads links from Flate-compressed streams", () => {
    const file = pdf(
      compressedStream(
        annotation(`https://docs.google.com/document/d/${B}/edit`),
      ),
    );
    expect(extractGoogleDocIds(file)).toEqual([B]);
  });

  it("lists a doc linked twice only once", () => {
    const link = annotation(`https://docs.google.com/document/d/${A}/edit`);
    expect(extractGoogleDocIds(pdf(latin1(link + link)))).toEqual([A]);
  });

  it("ignores links that are not Google Docs documents", () => {
    const file = pdf(
      latin1(
        annotation(
          "https://drive.google.com/file/d/1i49XREJGx18LguOTS-UrozxP_D0LCQmw/view",
        ),
      ),
      latin1(annotation("https://cbm.sc.gov.br")),
    );
    expect(extractGoogleDocIds(file)).toEqual([]);
  });

  it("returns an empty list for a PDF without links", () => {
    expect(extractGoogleDocIds(pdf(latin1("1 0 obj\n<<>>\nendobj\n")))).toEqual(
      [],
    );
  });
});
