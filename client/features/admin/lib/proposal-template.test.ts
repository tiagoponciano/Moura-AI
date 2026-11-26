import { describe, expect, it } from "vitest";
import {
  tagProblems,
  templateFileProblem,
  templateSource,
  templateSummary,
} from "./proposal-template";

describe("templateSummary", () => {
  it("says the app's own deck is in use when none was uploaded", () => {
    expect(
      templateSummary({
        inUse: { used: [], unused: [] },
        custom: null,
        tags: [],
      }),
    ).toBe("Modelo padrão do app");
  });

  it("names the uploaded file", () => {
    expect(
      templateSummary({
        custom: {
          fileName: "nova.pptx",
          sizeBytes: 1,
          uploadedAt: "2026-11-26T10:00:00Z",
        },
        inUse: { used: [], unused: [] },
        tags: [],
      }),
    ).toBe("nova.pptx");
  });
});

describe("templateSource", () => {
  const inUse = { used: [], unused: [] };

  it("says the app's own deck is in use", () => {
    expect(templateSource({ inUse, custom: null, tags: [] })).toBe(
      "Modelo padrão do app: nenhum modelo foi enviado.",
    );
  });

  it("names the uploaded file", () => {
    const text = templateSource({
      inUse,
      custom: {
        fileName: "nova.pptx",
        sizeBytes: 1,
        uploadedAt: "2026-11-26T10:00:00Z",
      },
      tags: [],
    });
    expect(text).toContain("Modelo enviado: nova.pptx");
  });
});

describe("tagProblems", () => {
  it("lists the tags the app does not know", () => {
    expect(tagProblems({ unknown: ["valor", "total"] })).toBe(
      "O app não conhece: {{valor}}, {{total}}.",
    );
  });

  it("lists the required tags a deck lacks", () => {
    expect(tagProblems({ missing: ["client", "price"] })).toBe(
      "Faltam no modelo: {{client}}, {{price}}.",
    );
  });

  it("returns nothing when no tag was listed", () => {
    expect(tagProblems({ unknown: [], missing: [] })).toBeUndefined();
  });
});

describe("templateFileProblem", () => {
  it("accepts a .pptx of any letter case within the limit", () => {
    expect(
      templateFileProblem({ name: "Proposta.PPTX", size: 1000 }),
    ).toBeUndefined();
  });

  it("refuses another kind of file", () => {
    expect(templateFileProblem({ name: "proposta.pdf", size: 1000 })).toBe(
      "O modelo precisa ser uma apresentação .pptx.",
    );
  });

  it("refuses a deck over 20 MB", () => {
    expect(
      templateFileProblem({ name: "grande.pptx", size: 21 * 1024 * 1024 }),
    ).toBe("O arquivo passa de 20 MB.");
  });
});
