import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table13Json from "../../norms/in-1-p2/tables/table-13.json";
import table14Json from "../../norms/in-1-p2/tables/table-14.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_13_SPEC, TABLE_14_SPEC, TABLE_2_G_SPEC } from "./group-g";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table13 = table13Json as unknown as ExtractedTable;
const table14 = table14Json as unknown as ExtractedTable;

/** A Grupo G building inside the scope of the tables. */
const garage = (overrides: Facts = {}): Facts => ({
  division: "G-1",
  area_m2: 3000,
  storeys: 3,
  height_m: 9,
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

describe("rule set with Grupos C, D, E and G", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the Grupo G cells cite, and only those", () => {
    const all = [0, 1, 2, 3, 4, 5];
    expect(TABLE_2_G_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [0]),
    );
    expect(TABLE_13_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table13, all),
    );
    expect(TABLE_13_SPEC.notes.map((n) => n.number)).toEqual(
      table13.notes.map((n) => n.number),
    );
    expect(TABLE_14_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table14, all),
    );
    expect(TABLE_14_SPEC.notes.map((n) => n.number)).toEqual(
      table14.notes.map((n) => n.number),
    );
  });
});

describe("Grupo G: Tabela 13 (G-1, G-2 and G-5)", () => {
  it("names the table and requires sprinklers only from 23 m", () => {
    expect(classify(garage(), DATE).table).toBe("Tabela 13, coluna 6 < H ≤ 12");
    expect(system(garage(), "sprinklers")?.status).toBe("not_required");
    expect(
      system(garage({ storeys: 8, height_m: 25 }), "sprinklers")?.status,
    ).toBe("required");
  });

  it("requires smoke control from 90 m for G-1 and G-2 only (note 3)", () => {
    const tower = (division: string, height_m: number) =>
      garage({ division, storeys: 30, height_m });
    expect(system(tower("G-1", 89.99), "smoke_control")?.status).toBe(
      "not_required",
    );
    expect(system(tower("G-1", 90), "smoke_control")?.status).toBe("required");
    expect(system(tower("G-2", 90), "smoke_control")?.status).toBe("required");
    expect(system(tower("G-5", 90), "smoke_control")?.status).toBe(
      "not_required",
    );
  });

  it("requires detection from 5.000 m², in the places of note 4", () => {
    const tall = { storeys: 8, height_m: 25 };
    expect(
      system(garage({ ...tall, area_m2: 4999.99 }), "automatic_detection")
        ?.status,
    ).toBe("not_required");
    const at = system(
      garage({ ...tall, area_m2: 5000 }),
      "automatic_detection",
    )!;
    expect(at).toMatchObject({ status: "required", partial: true });
    expect(at.scopes[0]).toContain("estacionamento de veículos");
  });

  it("requires the elevator from 60 m (note 5) and limits vertical compartmentation (note 2)", () => {
    expect(
      system(garage({ storeys: 20, height_m: 59.99 }), "emergency_elevator")
        ?.status,
    ).toBe("not_required");
    expect(
      system(garage({ storeys: 20, height_m: 60 }), "emergency_elevator")
        ?.status,
    ).toBe("required");
    const vertical = system(
      garage({ storeys: 5, height_m: 15 }),
      "vertical_compartmentation",
    )!;
    expect(vertical).toMatchObject({ status: "required", partial: true });
    expect(vertical.scopes[0]).toContain("fachadas, shafts e dutos");
  });
});

describe("Grupo G: Tabela 14 (G-3 and G-4)", () => {
  const big = { area_m2: 2000, storeys: 3, height_m: 9 };

  it("names Tabela 14", () => {
    expect(classify(garage({ ...big, division: "G-4" }), DATE).table).toBe(
      "Tabela 14, coluna 6 < H ≤ 12",
    );
  });

  it("requires horizontal compartmentation only for G-4 and shows that sprinklers can replace it (notes 2 and 3)", () => {
    const g4 = system(
      garage({ ...big, division: "G-4" }),
      "horizontal_compartmentation",
    )!;
    expect(g4.status).toBe("required");
    expect(g4.substitutions[0].by).toEqual(["sprinklers"]);
    expect(
      system(garage({ ...big, division: "G-3" }), "horizontal_compartmentation")
        ?.status,
    ).toBe("not_required");
  });

  it("requires detection in the rooms of note 5 in every column, and the elevator from 60 m", () => {
    const detection = system(
      garage({ ...big, division: "G-4" }),
      "automatic_detection",
    )!;
    expect(detection).toMatchObject({ status: "required", partial: true });
    expect(detection.scopes[0]).toContain("depósitos");
    expect(
      system(
        garage({ ...big, division: "G-4", storeys: 20, height_m: 60 }),
        "emergency_elevator",
      )?.status,
    ).toBe("required");
  });
});

describe("Grupo G: risk (the rows of Quadro 2)", () => {
  it.each([
    [
      "G-1 up to 21 m and 5.000 m²",
      { height_m: 21, storeys: 7, area_m2: 5000 },
      "III",
    ],
    ["G-1 above 21 m", { height_m: 21.01, storeys: 7, area_m2: 1000 }, "IV"],
    [
      "G-5 above 5.000 m²",
      { division: "G-5", height_m: 8, area_m2: 5000.01 },
      "IV",
    ],
    [
      "G-4 up to 6 m and 5.000 m²",
      { division: "G-4", height_m: 6, storeys: 2, area_m2: 5000 },
      "III",
    ],
    [
      "G-4 from 6 to 12 m up to 3.000 m²",
      { division: "G-4", height_m: 12, storeys: 3, area_m2: 3000 },
      "III",
    ],
    [
      "G-4 from 6 to 12 m above 3.000 m²",
      { division: "G-4", height_m: 12, storeys: 3, area_m2: 3000.01 },
      "IV",
    ],
    [
      "G-4 above 12 m",
      { division: "G-4", height_m: 12.01, storeys: 4, area_m2: 1000 },
      "IV",
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(level(garage(overrides))).toBe(expected);
  });

  it("is II for a small garage, and the G-3 row only decides when II fails", () => {
    expect(
      level(garage({ division: "G-3", storeys: 1, height_m: 4, area_m2: 700 })),
    ).toBe("II");
    const withLpg = {
      special_risks: true,
      hazardous_substances: false,
      glp_kg: 200,
      flammable_internal_l: 0,
      flammable_external_m3: 0,
    };
    expect(
      level(
        garage({
          division: "G-3",
          storeys: 1,
          height_m: 4,
          area_m2: 700,
          ...withLpg,
        }),
      ),
    ).toBe("III");
    expect(
      level(
        garage({
          division: "G-3",
          storeys: 1,
          height_m: 4,
          area_m2: 750.01,
          ...withLpg,
        }),
      ),
    ).toBe("IV");
    expect(
      level(
        garage({
          division: "G-3",
          storeys: 2,
          height_m: 6,
          area_m2: 700,
          ...withLpg,
        }),
      ),
    ).toBe("IV");
  });
});

describe("Grupo G: scope", () => {
  it("is not asked about storage, and stops at the boundary, several blocks or mixed use", () => {
    expect(
      classify(garage({ area_m2: 700 }), DATE).nextQuestions.map((q) => q.fact),
    ).not.toContain("storage_over_3_5m");
    for (const overrides of [
      { area_m2: 750 },
      { single_block: false },
      { single_use: false },
    ]) {
      expect(classify(garage(overrides), DATE).status).toBe("analysis");
    }
  });
});
