import { describe, expect, it } from "vitest";
import { parseFormTitle, titleFromContentDisposition } from "./title";

describe("parseFormTitle", () => {
  it("splits IN number, annex letter and name", () => {
    expect(
      parseFormTitle("IN 1 - Anexo D - Formulário para consulta técnica.docx"),
    ).toEqual({
      normative: 1,
      annex: "D",
      name: "Formulário para consulta técnica",
    });
  });

  it("collapses repeated spaces in the CBMSC titles", () => {
    expect(
      parseFormTitle("IN 7 - Anexo C -  Relatório de Comissionamento do SHP"),
    ).toEqual({
      normative: 7,
      annex: "C",
      name: "Relatório de Comissionamento do SHP",
    });
  });

  it("keeps a dash that belongs to the name", () => {
    expect(
      parseFormTitle(
        "IN 24 - Anexo E - Evento Grande Porte - Laudo Comissionamento",
      ),
    ).toMatchObject({
      annex: "E",
      name: "Evento Grande Porte - Laudo Comissionamento",
    });
  });

  it("upper-cases a lower-case annex letter", () => {
    expect(parseFormTitle("IN 2 - anexo k - Recurso").annex).toBe("K");
  });

  it("returns only the name when the title does not follow the pattern", () => {
    expect(parseFormTitle("Cartilha para RTs.docx")).toEqual({
      normative: null,
      annex: null,
      name: "Cartilha para RTs",
    });
  });
});

describe("titleFromContentDisposition", () => {
  it("prefers the UTF-8 file name", () => {
    expect(
      titleFromContentDisposition(
        `attachment; filename="IN 1 - Anexo D.docx"; filename*=UTF-8''IN%201%20-%20Anexo%20D%20-%20Formul%C3%A1rio.docx`,
      ),
    ).toBe("IN 1 - Anexo D - Formulário.docx");
  });

  it("falls back to the quoted file name", () => {
    expect(
      titleFromContentDisposition(`attachment; filename="Modelo.docx"`),
    ).toBe("Modelo.docx");
  });

  it("returns undefined without a header or a file name", () => {
    expect(titleFromContentDisposition(null)).toBeUndefined();
    expect(titleFromContentDisposition("inline")).toBeUndefined();
  });
});
