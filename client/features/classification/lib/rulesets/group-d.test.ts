import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table6Json from "../../norms/in-1-p2/tables/table-06.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_2_D_SPEC, TABLE_6_SPEC } from "./group-d";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table6 = table6Json as unknown as ExtractedTable;

/** A Grupo D building inside the scope of the tables. */
const office = (overrides: Facts = {}): Facts => ({
  division: "D-1",
  area_m2: 700,
  storeys: 2,
  height_m: 8,
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
const required = (facts: Facts) =>
  run(facts)
    .systems.filter((s) => s.status === "required")
    .map((s) => s.id)
    .sort();
const level = (facts: Facts) => {
  const r = run(facts).risk;
  return r.status === "decided" ? r.level : r.status;
};

describe("rule set with Grupo C and Grupo D", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the Grupo D cells cite, and only those", () => {
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
    expect(TABLE_2_D_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [0]),
    );
    expect(TABLE_6_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table6, [0, 1, 2, 3, 4, 5]),
    );
    expect(TABLE_6_SPEC.notes.map((n) => n.number)).toEqual(
      table6.notes.map((n) => n.number),
    );
  });
});

describe("Grupo D: small buildings (Tabela 2, column A-2, A-3, D, E e G)", () => {
  it("requires the printed systems, with extinguishers, lighting and signage vital", () => {
    expect(required(office())).toEqual(
      [
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
    ]) {
      expect(system(office(), id)?.vital).toBe(true);
    }
  });

  it("asks for the hydraulic system from 4 storeys and the low voltage installations from 200 m²", () => {
    expect(
      system(office({ storeys: 3, height_m: 9 }), "hydraulic_preventive")
        ?.status,
    ).toBe("not_required");
    expect(
      system(office({ storeys: 4, height_m: 11 }), "hydraulic_preventive")
        ?.status,
    ).toBe("required");
    expect(
      system(office({ area_m2: 199.99 }), "low_voltage_installations")?.status,
    ).toBe("not_required");
  });
});

describe("Grupo D: large buildings (Tabela 6)", () => {
  const mid = office({ area_m2: 1800, height_m: 9 });

  it("requires 15 systems for a 1.800 m², two-storey office, and shows what can replace the compartmentation", () => {
    expect(required(mid)).toEqual(
      [
        "vehicle_access",
        "fire_alarm",
        "fire_brigade",
        "horizontal_compartmentation",
        "finishing_materials_control",
        "extinguishers",
        "combustible_gas",
        "hydraulic_preventive",
        "emergency_lighting",
        "low_voltage_installations",
        "structural_protection",
        "emergency_exits",
        "emergency_signage",
      ].sort(),
    );
    expect(
      system(mid, "horizontal_compartmentation")?.substitutions[0].by,
    ).toEqual(["sprinklers"]);
    expect(system(mid, "sprinklers")?.status).toBe("not_required");
  });

  it("requires sprinklers from 45 m (note 2), the elevator from 60 m (note 8) and smoke control from 90 m (note 7)", () => {
    const tower = (height_m: number) =>
      office({ area_m2: 3000, storeys: 20, height_m });
    expect(system(tower(44.99), "sprinklers")?.status).toBe("not_required");
    expect(system(tower(45), "sprinklers")?.status).toBe("required");
    expect(system(tower(59.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(tower(60), "emergency_elevator")?.status).toBe("required");
    expect(system(tower(89.99), "smoke_control")?.status).toBe("not_required");
    expect(system(tower(90), "smoke_control")?.status).toBe("required");
  });

  it("limits detection to the rooms of note 10 from 23 m", () => {
    const detection = system(
      office({ area_m2: 3000, storeys: 8, height_m: 25 }),
      "automatic_detection",
    )!;
    expect(detection).toMatchObject({ status: "required", partial: true });
    expect(detection.scopes[0]).toContain(
      "depósito com carga de incêndio superior a 300 MJ/m²",
    );
    expect(system(mid, "automatic_detection")?.status).toBe("not_required");
  });

  it("requires the emergency plan only from 23 m", () => {
    expect(system(mid, "emergency_plan")?.status).toBe("not_required");
    expect(
      system(
        office({ area_m2: 3000, storeys: 8, height_m: 25 }),
        "emergency_plan",
      )?.status,
    ).toBe("required");
  });

  it("uses the Térreo column for a single-storey building", () => {
    expect(
      classify(office({ storeys: 1, height_m: 14, area_m2: 800 }), DATE).table,
    ).toBe("Tabela 6, coluna Térreo");
  });
});

describe("Grupo D: risk (Quadro 1 and the three rows of Quadro 2)", () => {
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
      "6 to 12 m up to 3.000 m²",
      { height_m: 12, storeys: 3, area_m2: 3000 },
      "III",
    ],
    [
      "6 to 12 m above 3.000 m²",
      { height_m: 12, storeys: 3, area_m2: 3000.01 },
      "IV",
    ],
    [
      "12 to 21 m up to 2.000 m²",
      { height_m: 21, storeys: 7, area_m2: 2000 },
      "III",
    ],
    [
      "12 to 21 m above 2.000 m²",
      { height_m: 21, storeys: 7, area_m2: 2000.01 },
      "IV",
    ],
    ["above 21 m", { height_m: 21.01, storeys: 7, area_m2: 1000 }, "IV"],
  ])("%s", (_name, overrides, expected) => {
    expect(level(office(overrides))).toBe(expected);
  });

  it("is II for a small office and V above 2.280 MJ/m²", () => {
    expect(level(office())).toBe("II");
    expect(level(office({ fire_load_class: "very_high" }))).toBe("V");
  });
});

describe("Grupo D: scope", () => {
  it("is not asked about storage, which is a Grupo C rule", () => {
    const result = classify(office(), DATE);
    expect(result.status).toBe("complete");
    expect(result.nextQuestions.map((q) => q.fact)).not.toContain(
      "storage_over_3_5m",
    );
  });

  it("is not stopped by an answer about storage", () => {
    expect(
      classify(office({ storage_over_3_5m: true }), DATE).analyses,
    ).toEqual([]);
  });

  it("still stops at exactly 750 m², several blocks or mixed use", () => {
    for (const overrides of [
      { area_m2: 750 },
      { single_block: false },
      { single_use: false },
    ]) {
      expect(classify(office(overrides), DATE).status).toBe("analysis");
    }
  });

  it("sends a division without rules to analysis", () => {
    expect(
      classify(office({ division: "E-1" }), DATE).analyses[0].reason,
    ).toContain("ainda não está coberta");
  });
});
