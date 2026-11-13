import { describe, expect, it } from "vitest";
import table25Json from "../../norms/in-1-p2/tables/table-25.json";
import table26Json from "../../norms/in-1-p2/tables/table-26.json";
import table27Json from "../../norms/in-1-p2/tables/table-27.json";
import table28Json from "../../norms/in-1-p2/tables/table-28.json";
import table29Json from "../../norms/in-1-p2/tables/table-29.json";
import { classify } from "../classify";
import { evaluateCondition } from "../engine/condition";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Condition, Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import {
  TABLE_25_SPEC,
  TABLE_26_SPEC,
  TABLE_27_SPEC,
  TABLE_28_SPEC,
  TABLE_29_SPEC,
} from "./group-m-divisions";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const t = (j: unknown) => j as ExtractedTable;

const base: Facts = {
  area_m2: 3000,
  storeys: 4,
  height_m: 14,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  gas_suppression_system: false,
};
const f = (division: string, o: Facts = {}): Facts => ({
  ...base,
  division,
  ...o,
});
const run = (facts: Facts) => evaluateRules(ALL_RULES, facts, DATE);
const status = (facts: Facts, id: string) =>
  run(facts).systems.find((s) => s.id === id)?.status;
const analyses = (facts: Facts) =>
  run(facts).specificAnalyses.map((a) => a.ruleId);

describe("Grupo M (M-3 to M-11) rules", () => {
  it("are well formed and their derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encode every note of Tabelas 25 to 29", () => {
    for (const [spec, json] of [
      [TABLE_25_SPEC, table25Json],
      [TABLE_26_SPEC, table26Json],
      [TABLE_27_SPEC, table27Json],
      [TABLE_28_SPEC, table28Json],
      [TABLE_29_SPEC, table29Json],
    ] as const)
      expect(spec.notes.map((n) => n.number)).toEqual(
        t(json).notes.map((n) => n.number),
      );
  });

  it("names the table of each division", () => {
    for (const [division, table] of [
      ["M-3", "Tabela 25"],
      ["M-4", "Tabela 26"],
      ["M-7", "Tabela 26"],
      ["M-5", "Tabela 27"],
      ["M-6", "Tabela 28"],
      ["M-11", "Tabela 29"],
    ] as const)
      expect(classify(f(division), DATE).table).toContain(table);
  });
});

describe("M-3: Tabela 2 and Tabela 25", () => {
  it("uses the I, J and M3 column of Tabela 2 for a small building", () => {
    const small = f("M-3", { area_m2: 700, storeys: 1, height_m: 0 });
    expect(status(small, "extinguishers")).toBe("required");
    expect(classify(small, DATE).table).toContain("Tabela 2");
  });

  it("uses Tabela 25 by height: elevator from 60 m (note 3)", () => {
    const tower = (height_m: number) =>
      f("M-3", { height_m, storeys: Math.ceil(height_m / 3) });
    expect(status(tower(59.9), "emergency_elevator")).toBe("not_required");
    expect(status(tower(60), "emergency_elevator")).toBe("required");
  });

  it("requires the emergency plan below 12 m only with a gas system (note 5)", () => {
    const low = (gas: boolean) =>
      f("M-3", {
        height_m: 8,
        storeys: 2,
        gas_suppression_system: gas,
      });
    expect(status(low(false), "emergency_plan")).toBe("not_required");
    expect(status(low(true), "emergency_plan")).toBe("required");
    expect(status(f("M-3", { height_m: 14 }), "emergency_plan")).toBe(
      "required",
    );
  });

  it("keeps the regime boundary guard", () => {
    expect(
      analyses(f("M-3", { area_m2: 750, height_m: 8, storeys: 2 })),
    ).toEqual(["GUARD-boundary"]);
  });
});

describe("M-4 and M-7: Tabela 26", () => {
  it("sends M-4 up to 1.500 m² to specific analysis", () => {
    expect(analyses(f("M-4", { area_m2: 1500 }))).toEqual([
      "GUARD-m4-up-to-1500",
    ]);
    expect(analyses(f("M-4", { area_m2: 1501 }))).toEqual([]);
    expect(status(f("M-4", { area_m2: 1501 }), "extinguishers")).toBe(
      "required",
    );
  });

  it("requires the M-7 hydraulic system and foam above 20 m³ of isotanks (note 5)", () => {
    expect(status(f("M-7"), "hydraulic_preventive")).toBe("required");
    expect(status(f("M-4", { area_m2: 2000 }), "hydraulic_preventive")).toBe(
      "not_required",
    );
    const foam = (isotank_total_m3: number) =>
      status(f("M-7", { isotank_total_m3 }), "foam");
    expect(foam(20)).toBe("not_required");
    expect(foam(21)).toBe("required");
  });

  it("does not treat exactly 750 m² or 12 m as a boundary", () => {
    expect(analyses(f("M-7", { area_m2: 750, height_m: 8 }))).toEqual([]);
  });
});

describe("M-5: Tabela 27", () => {
  it("requires the hydraulic system with 750 m² or more of support buildings (note 3)", () => {
    const hydraulic = (silo_support_area_m2: number) =>
      status(f("M-5", { silo_support_area_m2 }), "hydraulic_preventive");
    expect(hydraulic(749)).toBe("not_required");
    expect(hydraulic(750)).toBe("required");
    expect(status(f("M-5"), "extinguishers")).toBe("required");
  });
});

describe("M-6: Tabela 28", () => {
  it("sends up to 500 ha to specific analysis and lists the brigade and plan above", () => {
    expect(analyses(f("M-6", { planting_area_ha: 500 }))).toEqual([
      "GUARD-m6-up-to-500ha",
    ]);
    const above = f("M-6", { planting_area_ha: 501 });
    expect(analyses(above)).toEqual([]);
    expect(status(above, "emergency_plan")).toBe("required");
    expect(status(above, "fire_brigade")).toBe("required");
  });
});

describe("M-11: Tabela 29", () => {
  it("splits at 750 m² and requires lighting above 300 m² when small (note 2)", () => {
    const lighting = (area_m2: number) =>
      status(
        f("M-11", { area_m2, greenhouse_uses_gas: false }),
        "emergency_lighting",
      );
    expect(lighting(300)).toBe("not_required");
    expect(lighting(301)).toBe("required");
    const signage = (area_m2: number) =>
      status(
        f("M-11", { area_m2, greenhouse_uses_gas: false }),
        "emergency_signage",
      );
    expect(signage(749)).toBe("not_required");
    expect(signage(750)).toBe("required");
  });

  it("requires fuel gas only for greenhouses that use it (note 1)", () => {
    expect(
      status(f("M-11", { greenhouse_uses_gas: true }), "combustible_gas"),
    ).toBe("required");
    expect(
      status(f("M-11", { greenhouse_uses_gas: false }), "combustible_gas"),
    ).toBe("not_required");
  });

  it("puts every area in exactly one column", () => {
    const holding = (area_m2: number) =>
      TABLE_29_SPEC.columns.filter(
        (c) =>
          evaluateCondition(c.when as Condition, f("M-11", { area_m2 }))
            .outcome === "true",
      );
    for (const area of [0, 749.99, 750, 751])
      expect(holding(area)).toHaveLength(1);
  });
});
