import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  describeCondition,
  renderGroupAReviewSheet,
  renderGroupBReviewSheet,
  renderGroupCReviewSheet,
  renderGroupDReviewSheet,
  renderGroupEReviewSheet,
  renderGroupGReviewSheet,
  renderGroupHReviewSheet,
  renderGroupIJReviewSheet,
} from "./review-sheet";
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

describe("renderGroupDReviewSheet", () => {
  const sheet = renderGroupDReviewSheet();
  const FILE = join(__dirname, "../../docs/group-d-review-sheet.md");

  it("covers Tabela 6 and the notes of the shared Tabela 2 column", () => {
    for (let n = 1; n <= 10; n++)
      expect(sheet).toContain(`### Tabela 6, nota ${n}\n`);
    expect(sheet).toContain("### Tabela 2, nota 1\n");
    expect(sheet).toContain("**Todas as regras são provisórias.**");
  });

  it("asks what is specific to the group and leaves out what belongs to Grupo C", () => {
    expect(sheet).toContain("**Coluna compartilhada da Tabela 2.**");
    expect(sheet).toContain("**Risco III do Grupo D.**");
    expect(sheet).not.toContain("**Risco III para C-2.**");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupEReviewSheet", () => {
  const sheet = renderGroupEReviewSheet();
  const FILE = join(__dirname, "../../docs/group-e-review-sheet.md");

  it("covers the thirteen notes of Tabela 7 and reads the exemption of note 8", () => {
    for (let n = 1; n <= 13; n++)
      expect(sheet).toContain(`### Tabela 7, nota ${n}\n`);
    expect(sheet).toContain("Dispensado quando");
    expect(sheet).toContain("**Células com duas notas na Tabela 7.**");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupGReviewSheet", () => {
  const sheet = renderGroupGReviewSheet();
  const FILE = join(__dirname, "../../docs/group-g-review-sheet.md");

  it("covers the notes of Tabelas 13 and 14", () => {
    for (let n = 1; n <= 5; n++)
      expect(sheet).toContain(`### Tabela 13, nota ${n}\n`);
    for (let n = 1; n <= 6; n++)
      expect(sheet).toContain(`### Tabela 14, nota ${n}\n`);
    expect(sheet).toContain("**Células com duas notas na Tabela 14.**");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupBReviewSheet", () => {
  const sheet = renderGroupBReviewSheet();
  const FILE = join(__dirname, "../../docs/group-b-review-sheet.md");

  it("covers the notes of Tabela 4 and the five columns", () => {
    for (let n = 1; n <= 7; n++)
      expect(sheet).toContain(`### Tabela 4, nota ${n}\n`);
    expect(sheet).toContain("**Tabela 4 tem cinco colunas de altura.**");
    expect(sheet).toContain("12 < H ≤ 30");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupAReviewSheet", () => {
  const sheet = renderGroupAReviewSheet();
  const FILE = join(__dirname, "../../docs/group-a-review-sheet.md");

  it("covers the A-2 and A-3 notes of Tabela 3 and leaves out the A-1 ones", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17]) {
      expect(sheet).toContain(`### Tabela 3, nota ${n}\n`);
    }
    for (const n of [11, 12, 13, 14, 18]) {
      expect(sheet).not.toContain(`### Tabela 3, nota ${n}\n`);
    }
    expect(sheet).toContain("**A-1 não está coberto.**");
  });

  it("prints only the A-2 and A-3 grid, with its own columns", () => {
    expect(sheet).toContain("6 < H ≤ 15");
    expect(sheet).not.toContain("Isolamento entre edificações");
    expect(sheet).not.toContain("Hidrantes Urbanos");
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupHReviewSheet", () => {
  const sheet = renderGroupHReviewSheet();
  const FILE = join(__dirname, "../../docs/group-h-review-sheet.md");

  it("covers the notes of Tabelas 15, 16 and 17, and the two columns of Tabela 2", () => {
    for (let n = 1; n <= 11; n++)
      expect(sheet).toContain(`### Tabela 15, nota ${n}\n`);
    for (let n = 1; n <= 8; n++) {
      expect(sheet).toContain(`### Tabela 16, nota ${n}\n`);
      expect(sheet).toContain(`### Tabela 17, nota ${n}\n`);
    }
    expect(sheet).toContain("H1, H4 e H6");
    expect(sheet).toContain("H2, H3 e H5");
    expect(sheet.match(/### Tabela 2, nota 2\n/g)).toHaveLength(1);
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});

describe("renderGroupIJReviewSheet", () => {
  const sheet = renderGroupIJReviewSheet();
  const FILE = join(__dirname, "../../docs/group-ij-review-sheet.md");

  it("covers the notes of Tabelas 18 to 21", () => {
    for (const [table, count] of [
      [18, 7],
      [19, 7],
      [20, 9],
      [21, 8],
    ] as const)
      for (let n = 1; n <= count; n++)
        expect(sheet).toContain(`### Tabela ${table}, nota ${n}\n`);
  });

  it("is the committed sheet", () => {
    if (process.env.UPDATE_REVIEW_SHEET === "1") writeFileSync(FILE, sheet);
    expect(readFileSync(FILE, "utf-8")).toBe(sheet);
  });
});
