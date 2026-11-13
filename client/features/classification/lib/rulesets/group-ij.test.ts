import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table18Json from "../../norms/in-1-p2/tables/table-18.json";
import table19Json from "../../norms/in-1-p2/tables/table-19.json";
import table20Json from "../../norms/in-1-p2/tables/table-20.json";
import table21Json from "../../norms/in-1-p2/tables/table-21.json";
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
  TABLE_18_SPEC,
  TABLE_19_SPEC,
  TABLE_20_SPEC,
  TABLE_21_SPEC,
  TABLE_2_IJ_SPEC,
} from "./group-ij";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const t = (j: unknown) => j as ExtractedTable;
const table2 = t(table2Json);

const plant = (overrides: Facts = {}): Facts => ({
  division: "I-2",
  area_m2: 6000,
  storeys: 4,
  height_m: 14,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  ...overrides,
});
const run = (f: Facts) => evaluateRules(ALL_RULES, f, DATE);
const system = (f: Facts, id: string) =>
  run(f).systems.find((s) => s.id === id);
const level = (f: Facts) => {
  const r = run(f).risk;
  return r.status === "decided" ? r.level : r.status;
};
const tower = (height_m: number, o: Facts = {}) =>
  plant({ storeys: Math.ceil(height_m / 3), height_m, area_m2: 4000, ...o });

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

describe("rule set with Grupos I and J", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the cells cite", () => {
    expect(TABLE_2_IJ_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [8]),
    );
    for (const [spec, json] of [
      [TABLE_18_SPEC, table18Json],
      [TABLE_19_SPEC, table19Json],
      [TABLE_20_SPEC, table20Json],
      [TABLE_21_SPEC, table21Json],
    ] as const) {
      const table = t(json);
      expect(spec.notes.map((n) => n.number)).toEqual(
        table.notes.map((n) => n.number),
      );
    }
  });
});

describe("Grupos I and J: tables and notes", () => {
  it("names the table of each division", () => {
    for (const [division, table] of [
      ["I-1", 18],
      ["I-3", 19],
      ["J-2", 20],
      ["J-4", 21],
    ] as const) {
      expect(classify(plant({ division }), DATE).table).toContain(
        `Tabela ${table}`,
      );
    }
  });

  it("exempts J-1 from the brigade in the small column (Tabela 2, note 1)", () => {
    const small = { area_m2: 700, storeys: 2, height_m: 8 };
    expect(
      system(plant({ ...small, division: "J-1" }), "fire_brigade")?.status,
    ).toBe("not_required");
    expect(
      system(plant({ ...small, division: "I-2" }), "fire_brigade")?.status,
    ).toBe("required");
  });

  it("requires horizontal compartmentation up to 6 m only for I-2 (Tabela 18, note 7)", () => {
    const low = { storeys: 2, height_m: 5, area_m2: 3000 };
    expect(
      system(plant({ ...low, division: "I-1" }), "horizontal_compartmentation")
        ?.status,
    ).toBe("not_required");
    const i2 = system(
      plant({ ...low, division: "I-2" }),
      "horizontal_compartmentation",
    )!;
    expect(i2.status).toBe("required");
    expect(i2.substitutions[0].by).toEqual(["sprinklers"]);
  });

  it("requires I-2 sprinklers from 23 m and never for I-1 (Tabela 18, note 2)", () => {
    expect(system(tower(25, { division: "I-2" }), "sprinklers")?.status).toBe(
      "required",
    );
    expect(system(tower(25, { division: "I-1" }), "sprinklers")?.status).toBe(
      "not_required",
    );
  });

  it("requires the I-3 smoke control only above 20.000 m² (Tabela 19, note 7)", () => {
    expect(
      system(plant({ division: "I-3", area_m2: 20000 }), "smoke_control")
        ?.status,
    ).toBe("not_required");
    expect(
      system(plant({ division: "I-3", area_m2: 20000.01 }), "smoke_control")
        ?.status,
    ).toBe("required");
  });

  it("requires the elevator from 60 m for I and J", () => {
    for (const division of ["I-2", "J-2"]) {
      expect(
        system(tower(59.99, { division }), "emergency_elevator")?.status,
        division,
      ).toBe("not_required");
      expect(
        system(tower(60, { division }), "emergency_elevator")?.status,
        division,
      ).toBe("required");
    }
  });

  it("asks for the storage area for J-2 and decides by it (Tabela 20, note 2)", () => {
    const j2 = (storage_area_m2?: number, height_m = 25) =>
      plant({
        division: "J-2",
        storeys: Math.ceil(height_m / 3),
        height_m,
        area_m2: 3000,
        ...(storage_area_m2 === undefined ? {} : { storage_area_m2 }),
      });
    expect(system(j2(), "sprinklers")?.status).toBe("needs_info");
    expect(system(j2(749.99), "sprinklers")?.status).toBe("not_required");
    expect(system(j2(750), "sprinklers")?.status).toBe("required");
    expect(system(j2(499.99, 31), "sprinklers")?.status).toBe("not_required");
    expect(system(j2(500, 31), "sprinklers")?.status).toBe("required");
  });

  it("requires J-4 sprinklers from 10.000 m² and J-3 only with a depósito of 500 m² (Tabela 21)", () => {
    const low = { storeys: 2, height_m: 6 };
    expect(
      system(plant({ ...low, division: "J-4", area_m2: 9999 }), "sprinklers")
        ?.status,
    ).toBe("not_required");
    expect(
      system(plant({ ...low, division: "J-4", area_m2: 10000 }), "sprinklers")
        ?.status,
    ).toBe("required");
    expect(
      system(plant({ ...low, division: "J-3", area_m2: 10000 }), "sprinklers")
        ?.status,
    ).toBe("not_required");
    const j3 = (storage_area_m2: number) =>
      plant({ division: "J-3", area_m2: 4000, storage_area_m2 });
    expect(system(j3(499.99), "sprinklers")?.status).toBe("not_required");
    expect(system(j3(500), "sprinklers")?.status).toBe("required");
  });
});

describe("Grupos I and J: risk (the rows of Quadro 2)", () => {
  it.each([
    [
      "I-1 up to 21 m and 5.000 m²",
      { division: "I-1", height_m: 21, storeys: 7, area_m2: 5000 },
      "III",
    ],
    [
      "I-1 above 5.000 m²",
      { division: "I-1", height_m: 9, storeys: 3, area_m2: 5000.01 },
      "IV",
    ],
    [
      "I-2 up to 12 m and 5.000 m²",
      { division: "I-2", height_m: 12, storeys: 4, area_m2: 5000 },
      "III",
    ],
    [
      "I-2 above 12 m",
      { division: "I-2", height_m: 12.01, storeys: 4, area_m2: 1000 },
      "IV",
    ],
    [
      "I-3 up to 6 m and 4.000 m²",
      { division: "I-3", height_m: 6, storeys: 2, area_m2: 4000 },
      "III",
    ],
    [
      "I-3 up to 6 m above 4.000 m²",
      { division: "I-3", height_m: 6, storeys: 2, area_m2: 4000.01 },
      "IV",
    ],
    [
      "J-2 from 6 to 12 m up to 3.000 m²",
      { division: "J-2", height_m: 12, storeys: 4, area_m2: 3000 },
      "III",
    ],
    [
      "J-2 from 6 to 12 m above 3.000 m²",
      { division: "J-2", height_m: 12, storeys: 4, area_m2: 3000.01 },
      "IV",
    ],
    [
      "J-3 up to 6 m and 3.000 m²",
      { division: "J-3", height_m: 6, storeys: 2, area_m2: 3000 },
      "III",
    ],
    [
      "J-3 above 3.000 m²",
      { division: "J-3", height_m: 6, storeys: 2, area_m2: 3000.01 },
      "IV",
    ],
    [
      "J-4 up to 6 m and 2.500 m²",
      { division: "J-4", height_m: 6, storeys: 2, area_m2: 2500 },
      "III",
    ],
    [
      "J-4 above 2.500 m²",
      { division: "J-4", height_m: 6, storeys: 2, area_m2: 2500.01 },
      "IV",
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(level(plant(overrides))).toBe(expected);
  });
});

describe("Grupos I and J: scope", () => {
  it("stops at the boundary or several blocks", () => {
    for (const overrides of [
      { area_m2: 750, storeys: 2, height_m: 8 },
      { single_block: false },
    ]) {
      expect(classify(plant(overrides), DATE).status).toBe("analysis");
    }
  });
});
