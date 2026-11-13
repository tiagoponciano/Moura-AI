import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table15Json from "../../norms/in-1-p2/tables/table-15.json";
import table16Json from "../../norms/in-1-p2/tables/table-16.json";
import table17Json from "../../norms/in-1-p2/tables/table-17.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import {
  TABLE_15_SPEC,
  TABLE_16_SPEC,
  TABLE_17_SPEC,
  TABLE_2_H146_SPEC,
  TABLE_2_H235_SPEC,
} from "./group-h";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table15 = table15Json as unknown as ExtractedTable;
const table16 = table16Json as unknown as ExtractedTable;
const table17 = table17Json as unknown as ExtractedTable;

/** A Grupo H building inside the scope of the tables. */
const clinic = (overrides: Facts = {}): Facts => ({
  division: "H-2",
  area_m2: 3000,
  storeys: 4,
  height_m: 14,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  ...overrides,
});

const run = (facts: Facts) => evaluateRules(ALL_RULES, facts, DATE);
const system = (facts: Facts, id: string) =>
  run(facts).systems.find((s) => s.id === id);
const level = (facts: Facts) => {
  const r = run(facts).risk;
  return r.status === "decided" ? r.level : r.status;
};
const tower = (height_m: number, overrides: Facts = {}) =>
  clinic({
    storeys: Math.ceil(height_m / 3),
    height_m,
    area_m2: 4000,
    ...overrides,
  });

const cited = (table: ExtractedTable, columns: number[]) =>
  [
    ...new Set(
      table.rows.flatMap((r) =>
        columns.flatMap((c) =>
          r.cells[c].mark === "x" ? r.cells[c].refs : [],
        ),
      ),
    ),
  ].sort((a, b) => a - b);
const all6 = [0, 1, 2, 3, 4, 5];

describe("rule set with Grupos A to E, G and H", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the Grupo H cells cite, in the five specs", () => {
    expect(TABLE_2_H146_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [6]),
    );
    expect(TABLE_2_H235_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [7]),
    );
    for (const [spec, table] of [
      [TABLE_15_SPEC, table15],
      [TABLE_16_SPEC, table16],
      [TABLE_17_SPEC, table17],
    ] as const) {
      expect(spec.notes.map((n) => n.number)).toEqual(cited(table, all6));
      expect(spec.notes.map((n) => n.number)).toEqual(
        table.notes.map((n) => n.number),
      );
    }
  });
});

describe("Grupo H: small buildings (Tabela 2, two columns)", () => {
  const small = { area_m2: 700, storeys: 2, height_m: 8 };

  it("marks the vital systems as each column prints them", () => {
    const h1 = clinic({ ...small, division: "H-1" });
    expect(system(h1, "low_voltage_installations")?.vital).toBe(true);
    expect(system(h1, "emergency_lighting")?.vital).toBe(false);
    expect(system(h1, "emergency_plan")?.status).toBe("not_required");
    const h2 = clinic({ ...small, division: "H-2" });
    expect(system(h2, "emergency_lighting")?.vital).toBe(true);
    expect(system(h2, "low_voltage_installations")?.vital).toBe(false);
    expect(system(h2, "emergency_plan")?.status).toBe("required");
  });

  it("uses the first column for H-1, H-4 and H-6 and the second for H-2, H-3 and H-5", () => {
    for (const division of ["H-1", "H-4", "H-6"]) {
      expect(
        system(clinic({ ...small, division }), "emergency_plan")?.status,
        division,
      ).toBe("not_required");
    }
    for (const division of ["H-2", "H-3", "H-5"]) {
      expect(
        system(clinic({ ...small, division }), "emergency_plan")?.status,
        division,
      ).toBe("required");
    }
  });
});

describe("Grupo H: Tabela 15 (H-1, H-2 and H-6)", () => {
  it("names the table, and exempts H-1 from detection, smoke control and the plan", () => {
    expect(classify(clinic(), DATE).table).toBe(
      "Tabela 15, coluna 12 < H ≤ 23",
    );
    const h1 = clinic({ division: "H-1" });
    expect(system(h1, "automatic_detection")?.status).toBe("not_required");
    expect(system(h1, "emergency_plan")?.status).toBe("not_required");
    expect(system(h1, "horizontal_compartmentation")?.status).toBe(
      "not_required",
    );
  });

  it("limits horizontal compartmentation of H-2 to the autonomous units (note 3)", () => {
    const h2 = system(clinic(), "horizontal_compartmentation")!;
    expect(h2).toMatchObject({ status: "required", partial: true });
    expect(h2.scopes[0]).toContain("unidades autônomas");
  });

  it("requires horizontal compartmentation of H-6 and lets detection replace it up to 12 m (note 2)", () => {
    const low = system(
      clinic({ division: "H-6", storeys: 3, height_m: 9, area_m2: 3000 }),
      "horizontal_compartmentation",
    )!;
    expect(low.status).toBe("required");
    expect(low.substitutions[0].by).toEqual(["automatic_detection"]);
    const high = system(
      clinic({ division: "H-6" }),
      "horizontal_compartmentation",
    )!;
    expect(high.substitutions[0].by).toEqual([
      "automatic_detection",
      "sprinklers",
    ]);
    expect(
      system(tower(31, { division: "H-6" }), "horizontal_compartmentation")
        ?.substitutions,
    ).toEqual([]);
  });

  it("scopes detection by division (notes 8 and 9)", () => {
    const low = (division: string) =>
      system(
        clinic({ division, storeys: 3, height_m: 9, area_m2: 3000 }),
        "automatic_detection",
      )!;
    expect(low("H-2").scopes[0]).toContain("e nos quartos");
    expect(low("H-6").scopes[0]).not.toContain("quartos");
    expect(
      system(clinic({ division: "H-2" }), "automatic_detection")?.scopes[0],
    ).toContain("lavanderias");
  });

  it("requires smoke control for H-2 above 30 m and H-6 from 90 m (note 7), and the elevator from 60 m (note 10)", () => {
    expect(system(tower(30), "smoke_control")?.status).toBe("not_required");
    expect(system(tower(30.01), "smoke_control")?.status).toBe("required");
    expect(
      system(tower(89.99, { division: "H-6" }), "smoke_control")?.status,
    ).toBe("not_required");
    expect(
      system(tower(90, { division: "H-6" }), "smoke_control")?.status,
    ).toBe("required");
    expect(system(tower(59.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(tower(60), "emergency_elevator")?.status).toBe("required");
  });

  it("requires the emergency plan for H-2 and H-6 only (note 11)", () => {
    expect(system(clinic({ division: "H-6" }), "emergency_plan")?.status).toBe(
      "required",
    );
    expect(system(clinic({ division: "H-2" }), "emergency_plan")?.status).toBe(
      "required",
    );
  });
});

describe("Grupo H: Tabela 16 (H-3)", () => {
  const h3 = (overrides: Facts = {}) =>
    clinic({ division: "H-3", ...overrides });

  it("names Tabela 16 and requires the plan in every column", () => {
    expect(classify(h3(), DATE).table).toBe("Tabela 16, coluna 12 < H ≤ 23");
    expect(
      system(h3({ storeys: 1, height_m: 5, area_m2: 3000 }), "emergency_plan")
        ?.status,
    ).toBe("required");
  });

  it("requires the elevator from 21 m in the 12 to 23 m column (note 8), and always above 23 m", () => {
    expect(
      system(h3({ storeys: 7, height_m: 20.99 }), "emergency_elevator")?.status,
    ).toBe("not_required");
    expect(
      system(h3({ storeys: 7, height_m: 21 }), "emergency_elevator")?.status,
    ).toBe("required");
    expect(
      system(h3({ storeys: 9, height_m: 25 }), "emergency_elevator")?.status,
    ).toBe("required");
  });

  it("limits vertical compartmentation between 6 and 12 m to shafts and ducts (note 4)", () => {
    const v = system(
      h3({ storeys: 3, height_m: 9 }),
      "vertical_compartmentation",
    )!;
    expect(v).toMatchObject({ status: "required", partial: true });
    expect(v.scopes[0]).toContain("selagem de shafts e dutos");
  });
});

describe("Grupo H: Tabela 17 (H-4 and H-5)", () => {
  const h = (division: string, height_m: number) =>
    tower(height_m, { division });

  it("names Tabela 17 and requires the plan only for H-5 (note 7)", () => {
    expect(classify(clinic({ division: "H-4" }), DATE).table).toBe(
      "Tabela 17, coluna 12 < H ≤ 23",
    );
    expect(system(clinic({ division: "H-4" }), "emergency_plan")?.status).toBe(
      "not_required",
    );
    expect(system(clinic({ division: "H-5" }), "emergency_plan")?.status).toBe(
      "required",
    );
  });

  it("requires sprinklers only for H-4 from 100 m (note 2), and smoke control for H-5 above 30 m and H-4 from 90 m (note 4)", () => {
    expect(system(h("H-4", 99.99), "sprinklers")?.status).toBe("not_required");
    expect(system(h("H-4", 100), "sprinklers")?.status).toBe("required");
    expect(system(h("H-5", 100), "sprinklers")?.status).toBe("not_required");
    expect(system(h("H-5", 31), "smoke_control")?.status).toBe("required");
    expect(system(h("H-4", 89.99), "smoke_control")?.status).toBe(
      "not_required",
    );
    expect(system(h("H-4", 90), "smoke_control")?.status).toBe("required");
  });

  it("requires the elevator from 60 m (note 6)", () => {
    expect(system(h("H-4", 59.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(h("H-4", 60), "emergency_elevator")?.status).toBe("required");
    expect(system(h("H-5", 60), "emergency_elevator")?.status).toBe("required");
  });

  it("scopes detection by division (note 5)", () => {
    expect(
      system(clinic({ division: "H-4" }), "automatic_detection")?.scopes[0],
    ).toContain("depósitos com carga");
    expect(
      system(clinic({ division: "H-5" }), "automatic_detection")?.scopes[0],
    ).toContain("quartos");
  });
});

describe("Grupo H: risk (the rows of Quadro 2)", () => {
  it.each([
    [
      "H-1 up to 21 m and 5.000 m²",
      { division: "H-1", height_m: 21, storeys: 7, area_m2: 5000 },
      "III",
    ],
    [
      "H-4 above 5.000 m²",
      { division: "H-4", height_m: 8, storeys: 3, area_m2: 5000.01 },
      "IV",
    ],
    [
      "H-2 up to 12 m and 5.000 m²",
      { division: "H-2", height_m: 12, storeys: 4, area_m2: 5000 },
      "III",
    ],
    [
      "H-2 above 12 m",
      { division: "H-2", height_m: 12.01, storeys: 4, area_m2: 1000 },
      "IV",
    ],
    [
      "H-5 up to 6 m and 750 m², with 4 storeys",
      { division: "H-5", height_m: 6, storeys: 4, area_m2: 750 },
      "III",
    ],
    [
      "H-5 above 750 m²",
      { division: "H-5", height_m: 6, storeys: 4, area_m2: 750.01 },
      "IV",
    ],
    [
      "H-6 up to 6 m and 5.000 m²",
      { division: "H-6", height_m: 6, storeys: 2, area_m2: 5000 },
      "III",
    ],
    [
      "H-6 from 6 to 12 m up to 2.500 m²",
      { division: "H-6", height_m: 12, storeys: 3, area_m2: 2500 },
      "III",
    ],
    [
      "H-6 from 6 to 12 m above 2.500 m²",
      { division: "H-6", height_m: 12, storeys: 3, area_m2: 2500.01 },
      "IV",
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(level(clinic(overrides))).toBe(expected);
  });

  it("is II for a small clinic", () => {
    expect(level(clinic({ area_m2: 700, storeys: 2, height_m: 8 }))).toBe("II");
  });
});

describe("Grupo H: scope", () => {
  it("is not asked about storage, and stops at the boundary or several blocks", () => {
    expect(
      classify(
        clinic({ area_m2: 700, storeys: 2, height_m: 8 }),
        DATE,
      ).nextQuestions.map((q) => q.fact),
    ).not.toContain("storage_over_3_5m");
    for (const overrides of [
      { area_m2: 750, storeys: 2, height_m: 8 },
      { single_block: false },
      { single_use: false, only_subsidiary: false },
    ]) {
      expect(classify(clinic(overrides), DATE).status).toBe("analysis");
    }
  });
});
