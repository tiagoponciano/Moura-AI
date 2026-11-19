import { describe, expect, it } from "vitest";
import { nameWithProject } from "./file-name";

describe("nameWithProject", () => {
  it("puts the project's name after the file's own, before the extension", () => {
    expect(nameWithProject("Anexo C.docx", "Loja Centro")).toBe(
      "Anexo C - Loja Centro.docx",
    );
    expect(nameWithProject("Proposta.pptx", "Escola Vila Nova")).toBe(
      "Proposta - Escola Vila Nova.pptx",
    );
  });

  it("leaves the name as it is without a project, or with a blank one", () => {
    expect(nameWithProject("planta.dxf", undefined)).toBe("planta.dxf");
    expect(nameWithProject("planta.dxf", "   ")).toBe("planta.dxf");
  });

  it("replaces what a file name cannot hold, and keeps accents", () => {
    expect(nameWithProject("a.pdf", 'Clínica: "Santa Luzia" / Bloco B?')).toBe(
      "a - Clínica Santa Luzia Bloco B.pdf",
    );
  });

  it("handles a name with no extension and keeps only the last dot as the extension", () => {
    expect(nameWithProject("termo", "Obra 1")).toBe("termo - Obra 1");
    expect(nameWithProject("IN 1. Anexo C.docx", "X")).toBe(
      "IN 1. Anexo C - X.docx",
    );
  });

  it("cuts the project's part, not the file's, when the name is long", () => {
    const result = nameWithProject("Anexo C.docx", "P".repeat(300));
    expect(result.endsWith(".docx")).toBe(true);
    expect(result.startsWith("Anexo C - ")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(125);
  });

  it("never leaves a file with no name", () => {
    expect(nameWithProject("???.pdf", "Obra")).toBe("arquivo - Obra.pdf");
  });
});
