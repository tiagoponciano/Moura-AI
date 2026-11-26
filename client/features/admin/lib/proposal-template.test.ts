import { describe, expect, it } from "vitest";
import { tagProblems, templateSummary } from "./proposal-template";

describe("templateSummary", () => {
  it("says the app's own deck is in use when none was uploaded", () => {
    expect(templateSummary({ custom: null, tags: [] })).toBe(
      "Modelo padrão do app",
    );
  });

  it("names the uploaded file", () => {
    expect(
      templateSummary({
        custom: {
          fileName: "nova.pptx",
          sizeBytes: 1,
          uploadedAt: "2026-11-26T10:00:00Z",
        },
        tags: [],
      }),
    ).toBe("nova.pptx");
  });
});

describe("tagProblems", () => {
  it("lists the tags a deck lacks and the ones the app does not know", () => {
    expect(tagProblems({ missing: ["price"], unknown: ["valor"] })).toBe(
      "Faltam no modelo: {{price}}. O app não conhece: {{valor}}.",
    );
  });

  it("returns nothing when no tag was listed", () => {
    expect(tagProblems({ missing: [], unknown: [] })).toBeUndefined();
  });
});
