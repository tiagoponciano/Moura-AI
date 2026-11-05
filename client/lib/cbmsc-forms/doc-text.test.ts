import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { docxTextHash } from "./doc-text";

function docx(body: string): Uint8Array {
  const zip = new PizZip();
  zip.file(
    "word/document.xml",
    `<w:document><w:body>${body}</w:body></w:document>`,
  );
  return zip.generate({ type: "uint8array" });
}

const run = (text: string) =>
  `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;

describe("docxTextHash", () => {
  it("ignores how the text is split into runs and repeated spaces", () => {
    expect(docxTextHash(docx(run("Nome:  do") + run(" imóvel")))).toBe(
      docxTextHash(docx(run("Nome: do imóvel"))),
    );
  });

  it("ignores formatting", () => {
    expect(
      docxTextHash(docx(`<w:r><w:rPr><w:b/></w:rPr><w:t>Nome</w:t></w:r>`)),
    ).toBe(docxTextHash(docx(run("Nome"))));
  });

  it("changes when a word changes", () => {
    expect(docxTextHash(docx(run("Nome do imóvel")))).not.toBe(
      docxTextHash(docx(run("Nome da edificação"))),
    );
  });
});
