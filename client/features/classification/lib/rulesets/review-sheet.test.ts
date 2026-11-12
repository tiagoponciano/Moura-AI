import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { describeCondition, renderGroupCReviewSheet } from "./review-sheet";
import { fact, C2, C3 } from "./group-c-conditions";

const SHEET = join(__dirname, "../../docs/group-c-review-sheet.md");

describe("describeCondition", () => {
  it("reads a comparison with its unit", () => {
    expect(describeCondition(fact("area_m2", "gt", 3000))).toBe(
      "a área é maior que 3.000 m²",
    );
  });

  it("reads a class and a division in words", () => {
    expect(
      describeCondition(fact("fire_load_class", "in", ["high", "very_high"])),
    ).toBe("a classe de carga de incêndio é alta ou altíssima");
    expect(describeCondition(C2)).toBe("a divisão é C-2");
  });

  it("joins and nests conditions with e / ou and parentheses", () => {
    expect(
      describeCondition({
        any: [
          { all: [C2, fact("area_m2", "gt", 3000)] },
          { all: [C3, fact("area_m2", "gt", 5000)] },
        ],
      }),
    ).toBe(
      "(a divisão é C-2 e a área é maior que 3.000 m²) ou (a divisão é C-3 e a área é maior que 5.000 m²)",
    );
  });

  it("names a single-storey building by art. 8", () => {
    expect(describeCondition(fact("storeys", "eq", 1))).toBe(
      "o prédio é térreo (um pavimento, altura 0, art. 8º V)",
    );
  });

  it("reads booleans and negation", () => {
    expect(describeCondition(fact("single_block", "eq", true))).toBe(
      "o imóvel tem um só bloco",
    );
    expect(describeCondition(fact("single_block", "eq", false))).toBe(
      "não: o imóvel tem um só bloco",
    );
    expect(describeCondition({ not: C2 })).toBe("não (a divisão é C-2)");
  });
});

describe("renderGroupCReviewSheet", () => {
  const sheet = renderGroupCReviewSheet();

  it("states that nothing is approved and what is covered", () => {
    expect(sheet).toContain("**Todas as regras são provisórias.**");
    expect(sheet).toContain("Em vigor desde 24/04/2024");
  });

  it("quotes the printed note beside its reading and its limits", () => {
    expect(sheet).toContain(
      "**Texto da norma:** Dispensado para C-1. Exigido para (C-2 com área > 3.000 m² e com carga de incêndio alta ou altíssima) e (C-3 com área > 5.000 m²).",
    );
    expect(sheet).toContain(
      "a área é maior que 3.000 m²: em exatamente 3.000 m² → não; logo acima → sim",
    );
  });

  it("covers every note of Tabela 5 and the two notes of Tabela 2 column C", () => {
    for (let n = 1; n <= 12; n++)
      expect(sheet).toContain(`### Tabela 5, nota ${n}\n`);
    expect(sheet).toContain("### Tabela 2, nota 2\n");
    expect(sheet).toContain("### Tabela 2, nota 6\n");
  });

  it("lists the general questions, including the 750 m² / 12 m boundary", () => {
    expect(sheet).toContain("1. **Exatamente 750 m² ou 12 m.**");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(SHEET, sheet);
    expect(readFileSync(SHEET, "utf-8")).toBe(sheet);
  });
});
