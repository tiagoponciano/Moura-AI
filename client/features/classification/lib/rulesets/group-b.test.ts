import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table4Json from "../../norms/in-1-p2/tables/table-04.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_2_B_SPEC, TABLE_4_SPEC } from "./group-b";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table4 = table4Json as unknown as ExtractedTable;

/** A Grupo B building inside the scope of the tables. */
const hotel = (overrides: Facts = {}): Facts => ({
  division: "B-1",
  area_m2: 1800,
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

describe("rule set with Grupos B, C, D, E and G", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("includes the Grupo B rules", () => {
    expect(ALL_RULES.some((r) => r.id.startsWith("IN1P2-T04-"))).toBe(true);
    expect(ALL_RULES.some((r) => r.id.startsWith("IN1P1-RISK-III-B-"))).toBe(
      true,
    );
  });

  it("encodes every note the Grupo B cells cite, and only those", () => {
    expect(TABLE_2_B_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [1]),
    );
    expect(TABLE_4_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table4, [0, 1, 2, 3, 4]),
    );
    expect(TABLE_4_SPEC.notes.map((n) => n.number)).toEqual(
      table4.notes.map((n) => n.number),
    );
  });
});

describe("Grupo B: small buildings (Tabela 2, column B)", () => {
  const small = hotel({ area_m2: 700, storeys: 2, height_m: 8 });

  it("requires the printed systems, with the low voltage installations vital too", () => {
    const required = run(small)
      .systems.filter((s) => s.status === "required")
      .map((s) => s.id)
      .sort();
    expect(required).toEqual(
      [
        "automatic_detection",
        "combustible_gas",
        "emergency_exits",
        "emergency_lighting",
        "emergency_signage",
        "extinguishers",
        "fire_brigade",
        "low_voltage_installations",
      ].sort(),
    );
    for (const id of [
      "extinguishers",
      "emergency_lighting",
      "emergency_signage",
      "low_voltage_installations",
    ]) {
      expect(system(small, id)?.vital, id).toBe(true);
    }
    expect(system(small, "fire_brigade")?.vital).toBe(false);
  });

  it("limits detection to the bedrooms (note 5)", () => {
    const detection = system(small, "automatic_detection")!;
    expect(detection).toMatchObject({ status: "required", partial: true });
    expect(detection.scopes[0]).toContain("os quartos");
  });

  it("asks for the hydraulic system from 4 storeys and the low voltage installations from 200 m²", () => {
    expect(
      system(
        hotel({ area_m2: 700, storeys: 3, height_m: 9 }),
        "hydraulic_preventive",
      )?.status,
    ).toBe("not_required");
    expect(
      system(
        hotel({ area_m2: 700, storeys: 4, height_m: 11 }),
        "hydraulic_preventive",
      )?.status,
    ).toBe("required");
    expect(
      system(
        hotel({ area_m2: 199.99, storeys: 2, height_m: 8 }),
        "low_voltage_installations",
      )?.status,
    ).toBe("not_required");
  });
});

describe("Grupo B: large buildings (Tabela 4, five columns)", () => {
  it("names Tabela 4 and uses one column for 12 to 30 m", () => {
    expect(classify(hotel(), DATE).table).toBe("Tabela 4, coluna 6 < H ≤ 12");
    for (const height_m of [12.01, 23, 23.01, 30]) {
      expect(classify(hotel({ storeys: 8, height_m }), DATE).table).toBe(
        "Tabela 4, coluna 12 < H ≤ 30",
      );
    }
    expect(classify(hotel({ storeys: 12, height_m: 30.01 }), DATE).table).toBe(
      "Tabela 4, coluna > 30",
    );
  });

  it("limits horizontal compartmentation to the units up to 6 m (note 2) and lets sprinklers replace it from there (note 3)", () => {
    const upTo6 = system(
      hotel({ storeys: 2, height_m: 5 }),
      "horizontal_compartmentation",
    )!;
    expect(upTo6).toMatchObject({ status: "required", partial: true });
    expect(upTo6.scopes[0]).toContain("unidades autônomas");
    expect(
      system(hotel({ storeys: 1, height_m: 0 }), "horizontal_compartmentation")
        ?.status,
    ).toBe("not_required");
    const mid = system(hotel(), "horizontal_compartmentation")!;
    expect(mid).toMatchObject({ status: "required", partial: false });
    expect(mid.substitutions[0].by).toEqual(["sprinklers"]);
  });

  it("requires vertical compartmentation from 12 m, replaceable by smoke control and sprinklers up to 90 m (note 4)", () => {
    expect(system(hotel(), "vertical_compartmentation")?.status).toBe(
      "not_required",
    );
    const tall = system(
      hotel({ storeys: 8, height_m: 25 }),
      "vertical_compartmentation",
    )!;
    expect(tall.status).toBe("required");
    expect(tall.substitutions[0].by).toEqual(["smoke_control", "sprinklers"]);
    expect(
      system(hotel({ storeys: 30, height_m: 95 }), "vertical_compartmentation")
        ?.substitutions,
    ).toEqual([]);
  });

  it("requires sprinklers, the elevator and smoke control above 30 m, with the scopes of note 5", () => {
    const tower = (height_m: number) =>
      hotel({ area_m2: 3000, storeys: 12, height_m });
    expect(system(tower(30), "sprinklers")?.status).toBe("not_required");
    expect(system(tower(31), "sprinklers")?.status).toBe("required");
    expect(system(tower(59.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(tower(60), "emergency_elevator")?.status).toBe("required");
    const smoke = system(tower(31), "smoke_control")!;
    expect(smoke).toMatchObject({ status: "required", partial: true });
    expect(smoke.scopes).toHaveLength(1);
    expect(system(tower(90), "smoke_control")?.scopes).toHaveLength(2);
  });

  it("requires detection in every room, and the emergency plan from 12 m", () => {
    const detection = system(hotel(), "automatic_detection")!;
    expect(detection).toMatchObject({ status: "required", partial: true });
    expect(detection.scopes[0]).toContain("todos os ambientes");
    expect(system(hotel(), "emergency_plan")?.status).toBe("not_required");
    expect(
      system(hotel({ storeys: 8, height_m: 25 }), "emergency_plan")?.status,
    ).toBe("required");
  });
});

describe("Grupo B: risk (the two rows of Quadro 2)", () => {
  it.each([
    [
      "up to 6 m and 5.000 m²",
      { height_m: 6, storeys: 2, area_m2: 5000 },
      "III",
    ],
    [
      "up to 6 m above 5.000 m²",
      { height_m: 6, storeys: 2, area_m2: 5000.01 },
      "IV",
    ],
    [
      "6 to 12 m up to 4.000 m²",
      { height_m: 12, storeys: 3, area_m2: 4000 },
      "III",
    ],
    [
      "6 to 12 m above 4.000 m²",
      { height_m: 12, storeys: 3, area_m2: 4000.01 },
      "IV",
    ],
    ["above 12 m", { height_m: 12.01, storeys: 4, area_m2: 1000 }, "IV"],
  ])("%s", (_name, overrides, expected) => {
    expect(level(hotel(overrides))).toBe(expected);
  });

  it("is II for a small hotel", () => {
    expect(level(hotel({ area_m2: 700, storeys: 2, height_m: 8 }))).toBe("II");
  });
});

describe("Grupo B: scope", () => {
  it("is not asked about storage, and stops at the boundary, several blocks or mixed use", () => {
    expect(
      classify(hotel({ area_m2: 700 }), DATE).nextQuestions.map((q) => q.fact),
    ).not.toContain("storage_over_3_5m");
    for (const overrides of [
      { area_m2: 750 },
      { single_block: false },
      { single_use: false },
    ]) {
      expect(classify(hotel(overrides), DATE).status).toBe("analysis");
    }
  });
});
