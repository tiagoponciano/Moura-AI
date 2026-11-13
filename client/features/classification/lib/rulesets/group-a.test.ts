import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table3Json from "../../norms/in-1-p2/tables/table-03.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_2_A_SPEC, TABLE_3_A23_SPEC } from "./group-a";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table3 = table3Json as unknown as ExtractedTable;

/** An A-2 building inside the scope of the tables. */
const flat = (overrides: Facts = {}): Facts => ({
  division: "A-2",
  area_m2: 3000,
  storeys: 6,
  height_m: 17,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
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
  flat({
    storeys: Math.ceil(height_m / 3),
    height_m,
    area_m2: 4000,
    ...overrides,
  });

describe("rule set with Grupos A, B, C, D, E and G", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the A-2 and A-3 cells cite, from the right grid only", () => {
    const cited = (rows: ExtractedTable["rows"], columns: number[]) =>
      [
        ...new Set(
          rows.flatMap((r) =>
            columns.flatMap((c) =>
              r.cells[c].mark === "x" ? r.cells[c].refs : [],
            ),
          ),
        ),
      ].sort((a, b) => a - b);
    expect(TABLE_2_A_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2.rows, [0]),
    );
    const part1 = table3.rows.filter((r) => r.part === 1);
    expect(TABLE_3_A23_SPEC.notes.map((n) => n.number)).toEqual(
      cited(part1, [0, 1, 2, 3, 4]),
    );
    // Notes 11 to 14 and 18 belong to the A-1 grid, which is not loaded.
    expect(TABLE_3_A23_SPEC.notes.map((n) => n.number)).not.toContain(11);
  });

  it("does not load the A-1 grid", () => {
    expect(
      ALL_RULES.some(
        (r) => r.id.includes("isolation") || r.id.includes("urban"),
      ),
    ).toBe(false);
    expect(classify(flat({ division: "A-1" }), DATE).status).toBe("analysis");
  });
});

describe("A-2 and A-3: small buildings (Tabela 2)", () => {
  const small = { area_m2: 700, storeys: 2, height_m: 8 };

  it("exempts A-2 from the brigade (note 1) and requires it for A-3", () => {
    expect(system(flat(small), "fire_brigade")?.status).toBe("not_required");
    expect(
      system(flat({ ...small, division: "A-3" }), "fire_brigade")?.status,
    ).toBe("required");
  });

  it("requires the other printed systems for A-2", () => {
    const required = run(flat(small))
      .systems.filter((s) => s.status === "required")
      .map((s) => s.id)
      .sort();
    expect(required).toEqual(
      [
        "combustible_gas",
        "emergency_exits",
        "emergency_lighting",
        "emergency_signage",
        "extinguishers",
        "low_voltage_installations",
      ].sort(),
    );
  });
});

describe("A-2 and A-3: Tabela 3 columns and the table name", () => {
  it.each([
    [{ storeys: 1, height_m: 5 }, "Tabela 3, coluna Térrea"],
    [{ storeys: 2, height_m: 6 }, "Tabela 3, coluna H ≤ 6"],
    [{ storeys: 4, height_m: 10 }, "Tabela 3, coluna 6 < H ≤ 15"],
    [{ storeys: 6, height_m: 15 }, "Tabela 3, coluna 6 < H ≤ 15"],
    [{ storeys: 6, height_m: 15.01 }, "Tabela 3, coluna 15 < H ≤ 30"],
    [{ storeys: 10, height_m: 30 }, "Tabela 3, coluna 15 < H ≤ 30"],
    [{ storeys: 11, height_m: 30.01 }, "Tabela 3, coluna > 30"],
  ])("%j → %s", (overrides, expected) => {
    expect(classify(flat({ area_m2: 3000, ...overrides }), DATE).table).toBe(
      expected,
    );
  });
});

describe("A-2 and A-3: Tabela 3 systems", () => {
  it("exempts A-2 from the brigade and the emergency plan between 15 and 30 m, and requires them for A-3 (notes 1 and 7)", () => {
    expect(system(flat(), "fire_brigade")?.status).toBe("not_required");
    expect(
      system(flat({ division: "A-3", area_m2: 2000 }), "fire_brigade")?.status,
    ).toBe("required");
    expect(system(flat(), "emergency_plan")?.status).toBe("not_required");
    expect(
      system(flat({ division: "A-3", area_m2: 2000 }), "emergency_plan")
        ?.status,
    ).toBe("required");
  });

  it("limits the finishing materials control of A-2 to the common areas, from 12 m (notes 15 and 16)", () => {
    const at = (height_m: number, division = "A-2") =>
      system(
        flat({ division, area_m2: 2000, storeys: 5, height_m }),
        "finishing_materials_control",
      )!;
    expect(at(12).status).toBe("not_required");
    expect(at(12.01)).toMatchObject({ status: "required", partial: true });
    expect(at(12.01).scopes[0]).toBe("áreas comuns");
    expect(at(12.01, "A-3")).toMatchObject({
      status: "required",
      partial: false,
    });
    // above 15 m the cell cites note 16 alone, so there is no height exemption
    expect(system(flat(), "finishing_materials_control")).toMatchObject({
      status: "required",
      partial: true,
    });
  });

  it("limits vertical compartmentation to the atria from 15 m and lets smoke control replace it there (note 4)", () => {
    const vertical = system(flat(), "vertical_compartmentation")!;
    expect(vertical).toMatchObject({ status: "required", partial: true });
    expect(vertical.scopes[0]).toBe("átrios (quando houver)");
    expect(vertical.substitutions[0].by).toEqual(["smoke_control"]);
    expect(
      system(flat({ storeys: 4, height_m: 10 }), "vertical_compartmentation")
        ?.status,
    ).toBe("not_required");
  });

  it("requires sprinklers from 100 m (note 2) and the elevator from 60 m (note 6)", () => {
    expect(system(tower(99.99), "sprinklers")?.status).toBe("not_required");
    expect(system(tower(100), "sprinklers")?.status).toBe("required");
    expect(system(tower(59.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(tower(60), "emergency_elevator")?.status).toBe("required");
  });

  it("requires the emergency plan above 30 m from 60 m for A-2 and from 30 m for A-3 (note 8)", () => {
    expect(system(tower(59.99), "emergency_plan")?.status).toBe("not_required");
    expect(system(tower(60), "emergency_plan")?.status).toBe("required");
    expect(
      system(tower(31, { division: "A-3", area_m2: 2000 }), "emergency_plan")
        ?.status,
    ).toBe("required");
  });

  it("requires detection from 40 m with a scope that depends on the height and the division (note 5)", () => {
    expect(system(tower(39.99), "automatic_detection")?.status).toBe(
      "not_required",
    );
    const mid = system(tower(40), "automatic_detection")!;
    expect(mid).toMatchObject({ status: "required", partial: true });
    expect(mid.scopes[0]).toContain("um ponto no interior dos apartamentos");
    expect(system(tower(100), "automatic_detection")?.scopes[0]).toContain(
      "cômodos onde as pessoas podem estar adormecidas",
    );
    const a3 = system(
      tower(40, { division: "A-3", area_m2: 2000 }),
      "automatic_detection",
    )!;
    expect(a3.scopes[0]).toContain("quartos");
  });

  it("requires smoke control above 90 m for A-2 and above 60 m for A-3, in the places of note 17", () => {
    expect(system(tower(90), "smoke_control")?.status).toBe("not_required");
    expect(system(tower(90.01), "smoke_control")).toMatchObject({
      status: "required",
      partial: true,
    });
    expect(
      system(tower(60.01, { division: "A-3", area_m2: 2000 }), "smoke_control")
        ?.status,
    ).toBe("required");
    expect(
      system(tower(60, { division: "A-3", area_m2: 2000 }), "smoke_control")
        ?.status,
    ).toBe("not_required");
  });

  it("requires horizontal compartmentation between units above 75 m, replaceable by sprinklers up to 150 m (note 3)", () => {
    expect(system(tower(75), "horizontal_compartmentation")?.status).toBe(
      "not_required",
    );
    const above = system(tower(75.01), "horizontal_compartmentation")!;
    expect(above).toMatchObject({ status: "required", partial: true });
    expect(above.substitutions[0].by).toEqual(["sprinklers"]);
    expect(
      system(tower(151), "horizontal_compartmentation")?.substitutions,
    ).toEqual([]);
  });

  it("shows the substitutions of vertical compartmentation above 30 m (notes 9 and 10)", () => {
    const by = (height_m: number) =>
      system(tower(height_m), "vertical_compartmentation")!.substitutions.map(
        (s) => s.by,
      );
    expect(by(35)).toEqual([["automatic_detection"], ["sprinklers"]]);
    expect(by(41)).toEqual([["sprinklers"]]);
    expect(by(101)).toEqual([]);
  });
});

describe("A-2 and A-3: risk (the rows of Quadro 2)", () => {
  it.each([
    [
      "A-2 up to 21 m and 5.000 m²",
      { height_m: 21, storeys: 7, area_m2: 5000 },
      "III",
    ],
    ["A-2 above 21 m", { height_m: 21.01, storeys: 7, area_m2: 1000 }, "IV"],
    [
      "A-2 above 5.000 m²",
      { height_m: 12, storeys: 4, area_m2: 5000.01 },
      "IV",
    ],
    [
      "A-3 up to 2.500 m²",
      { division: "A-3", height_m: 12, storeys: 4, area_m2: 2500 },
      "III",
    ],
    [
      "A-3 above 2.500 m²",
      { division: "A-3", height_m: 12, storeys: 4, area_m2: 2500.01 },
      "IV",
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(level(flat(overrides))).toBe(expected);
  });

  it("is II for a small flat", () => {
    expect(level(flat({ area_m2: 700, storeys: 2, height_m: 8 }))).toBe("II");
  });
});
