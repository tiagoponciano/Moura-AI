import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table5Json from "../../norms/in-1-p2/tables/table-05.json";
import { evaluateCondition } from "../engine/condition";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Condition, Facts } from "../engine/types";
import { GROUP_C_RULES, TABLE_2_SPEC, TABLE_5_SPEC } from "./group-c";
import {
  DIVISION_SCOPE_GUARDS,
  REGIME_BOUNDARY,
  REGIME_LARGE,
  REGIME_SMALL,
  declaresGuard,
} from "./group-c-conditions";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table5 = table5Json as unknown as ExtractedTable;

/** A Grupo C building that stays inside the scope of the tables. */
const building = (overrides: Facts): Facts => ({
  division: "C-2",
  area_m2: 700,
  height_m: 8,
  storeys: 2,
  fire_load_class: "medium",
  single_block: true,
  single_use: true,
  storage_over_3_5m: false,
  ...overrides,
});

const run = (facts: Facts) => evaluateRules(GROUP_C_RULES, facts, DATE);
const status = (facts: Facts, system: string) =>
  run(facts).systems.find((s) => s.id === system);
const required = (facts: Facts) =>
  run(facts)
    .systems.filter((s) => s.status === "required")
    .map((s) => s.id)
    .sort();

describe("Grupo C rule set", () => {
  it("is well formed", () => {
    expect(lintRules(GROUP_C_RULES)).toEqual([]);
  });

  it("is provisional end to end", () => {
    expect(GROUP_C_RULES.every((r) => r.status === "provisional")).toBe(true);
    expect(run(building({})).provisional).toBe(true);
  });

  it("has derive rules that never overlap at any threshold", () => {
    const derive = GROUP_C_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((sample) =>
      [1, 2, 3].map((storeys) => ({ ...sample, storeys })),
    );
    expect(samples.length).toBeGreaterThan(1000);
    expect(findDeriveOverlaps(GROUP_C_RULES, samples, DATE)).toEqual([]);
  });

  it("puts every value in exactly one of small, large or the boundary", () => {
    const derive = GROUP_C_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((sample) =>
      [1, 2, 3].map((storeys) => ({ ...sample, storeys })),
    );
    for (const sample of samples) {
      const hits = [REGIME_SMALL, REGIME_LARGE, REGIME_BOUNDARY].filter(
        (c) => evaluateCondition(c, sample).outcome === "true",
      );
      expect(hits, JSON.stringify(sample)).toHaveLength(1);
    }
  });

  it("encodes every note its cells cite, and only those", () => {
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
    expect(TABLE_2_SPEC.notes.map((n) => n.number)).toEqual(cited(table2, [2]));
    expect(TABLE_5_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table5, [0, 1, 2, 3, 4, 5]),
    );
    expect(TABLE_5_SPEC.notes.map((n) => n.number)).toEqual(
      table5.notes.map((n) => n.number),
    );
  });

  it("quotes the printed note in every rule that cites one", () => {
    const rule = GROUP_C_RULES.find(
      (r) => r.id === "IN1P2-T05-sprinklers-h6_12-req1",
    )!;
    expect(rule.source.quote).toContain(
      "Dispensado para C-1. Exigido para (C-2 com área > 3.000 m² e com carga de incêndio alta ou altíssima)",
    );
    expect(rule.source.locator).toBe(
      "Tabela 5, Chuveiros automáticos, 6 < H ≤ 12",
    );
  });
});

describe("Grupo C: small buildings (Tabela 2, column C)", () => {
  it("requires the printed systems for a 700 m², two-storey shop", () => {
    expect(required(building({}))).toEqual(
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
  });

  it("marks extinguishers as vital, from the cell", () => {
    expect(status(building({}), "extinguishers")?.vital).toBe(true);
    expect(status(building({}), "emergency_exits")?.vital).toBe(false);
  });

  it("asks for the low voltage installations only from 200 m² (note 2)", () => {
    expect(
      status(building({ area_m2: 199.99 }), "low_voltage_installations")
        ?.status,
    ).toBe("not_required");
    expect(
      status(building({ area_m2: 200 }), "low_voltage_installations")?.status,
    ).toBe("required");
  });

  it("asks for the hydraulic preventive system from 4 storeys (note 6)", () => {
    expect(
      status(building({ storeys: 3, height_m: 9 }), "hydraulic_preventive")
        ?.status,
    ).toBe("not_required");
    expect(
      status(building({ storeys: 4, height_m: 11 }), "hydraulic_preventive")
        ?.status,
    ).toBe("required");
  });

  it("treats a single-storey building as height 0, whatever its roof height", () => {
    const facts = building({ storeys: 1, height_m: 14, area_m2: 700 });
    expect(run(facts).facts.regime).toBe("small");
    expect(run(facts).facts.height_class).toBe("ground");
  });
});

describe("Grupo C: large buildings (Tabela 5)", () => {
  it("requires sprinklers for a 3,200 m² C-2 with a high fire load, not below 3,000 m² (note 2)", () => {
    const base = { area_m2: 3200, height_m: 8, storeys: 2 };
    expect(
      status(building({ ...base, fire_load_class: "high" }), "sprinklers")
        ?.status,
    ).toBe("required");
    expect(
      status(
        building({ ...base, area_m2: 3000, fire_load_class: "high" }),
        "sprinklers",
      )?.status,
    ).toBe("not_required");
    expect(
      status(building({ ...base, fire_load_class: "medium" }), "sprinklers")
        ?.status,
    ).toBe("not_required");
  });

  it("asks for the fire load class only when it can change the answer", () => {
    const base = {
      area_m2: 3200,
      height_m: 8,
      storeys: 2,
      fire_load_class: undefined,
    };
    expect(status(building(base), "sprinklers")).toMatchObject({
      status: "needs_info",
      missing: ["fire_load_class"],
    });
    const small = { ...base, area_m2: 2000 };
    expect(status(building(small), "sprinklers")?.status).toBe("not_required");
  });

  it("derives the fire load class from a value in MJ/m² (IN 3, art. 11)", () => {
    const facts = building({
      area_m2: 3200,
      fire_load_class: undefined,
      fire_load_mj_m2: 1500,
    });
    expect(run(facts).facts.fire_load_class).toBe("high");
    expect(status(facts, "sprinklers")?.status).toBe("required");
  });

  it("dispenses sprinklers for a C-1, whatever its area", () => {
    expect(
      status(building({ division: "C-1", area_m2: 9000 }), "sprinklers")
        ?.status,
    ).toBe("not_required");
  });

  it("requires sprinklers for a C-3 above 5,000 m², and shows that detection and sprinklers can replace vertical compartmentation", () => {
    const shopping = building({
      division: "C-3",
      area_m2: 6000,
      height_m: 20,
      storeys: 5,
      fire_load_class: "medium",
    });
    expect(status(shopping, "sprinklers")?.status).toBe("required");
    const vertical = status(shopping, "vertical_compartmentation")!;
    expect(vertical.status).toBe("required");
    expect(vertical.substitutions.map((s) => s.by)).toEqual([
      ["automatic_detection", "sprinklers"],
      ["smoke_control"],
    ]);
    expect(vertical.substitutions[0].alreadyRequired).toEqual([
      "automatic_detection",
      "sprinklers",
    ]);
  });

  it("limits detection to storage rooms for a building up to 5,000 m², and to all rooms above (note 8)", () => {
    const tall = { division: "C-3", height_m: 20, storeys: 5 };
    const up = status(
      building({ ...tall, area_m2: 5000 }),
      "automatic_detection",
    )!;
    const over = status(
      building({ ...tall, area_m2: 5000.01 }),
      "automatic_detection",
    )!;
    expect(up).toMatchObject({ status: "required", partial: true });
    expect(up.scopes[0]).toContain("depósito com mais de 500 m²");
    expect(over.scopes[0]).toContain("todos os ambientes");
  });

  it("requires smoke control at 90 m, and in the atria of a C-3 above 12 m (note 7)", () => {
    const c3 = building({
      division: "C-3",
      area_m2: 6000,
      height_m: 20,
      storeys: 5,
    });
    expect(status(c3, "smoke_control")).toMatchObject({
      status: "required",
      partial: true,
    });
    const c2 = building({ area_m2: 6000, height_m: 20, storeys: 5 });
    expect(status(c2, "smoke_control")?.status).toBe("not_required");
    const tower = building({ area_m2: 6000, height_m: 90, storeys: 30 });
    expect(status(tower, "smoke_control")).toMatchObject({
      status: "required",
      partial: false,
    });
  });

  it("requires the emergency plan only for a C-3 up to 12 m (note 11)", () => {
    const low = { area_m2: 3200, height_m: 8, storeys: 2 };
    expect(
      status(building({ ...low, division: "C-3" }), "emergency_plan")?.status,
    ).toBe("required");
    expect(
      status(building({ ...low, division: "C-2" }), "emergency_plan")?.status,
    ).toBe("not_required");
  });

  it("picks the column from the height class, with a single storey as Térreo", () => {
    const facts = building({ storeys: 1, height_m: 20, area_m2: 800 });
    expect(run(facts).facts.regime).toBe("large");
    expect(run(facts).facts.height_class).toBe("ground");
    expect(
      run(building({ area_m2: 800, height_m: 12.01, storeys: 4 })).facts
        .height_class,
    ).toBe("h12_23");
    expect(
      run(building({ area_m2: 800, height_m: 12, storeys: 4 })).facts
        .height_class,
    ).toBe("h6_12");
  });
});

describe("Grupo C: what the tables do not settle", () => {
  const analyses = (facts: Facts) =>
    run(facts).specificAnalyses.map((a) => a.ruleId);

  it("sends exactly 750 m² and exactly 12 m to specific analysis", () => {
    expect(analyses(building({ area_m2: 750, height_m: 8 }))).toEqual([
      "GUARD-boundary",
    ]);
    expect(
      analyses(building({ area_m2: 500, height_m: 12, storeys: 3 })),
    ).toEqual(["GUARD-boundary"]);
    expect(analyses(building({ area_m2: 749.99, height_m: 11.99 }))).toEqual(
      [],
    );
    expect(analyses(building({ area_m2: 750.01, height_m: 8 }))).toEqual([]);
  });

  it("does not treat a 12 m single-storey building as the boundary", () => {
    expect(
      analyses(building({ area_m2: 500, height_m: 12, storeys: 1 })),
    ).toEqual([]);
  });

  it("sends a division outside Grupo C to specific analysis", () => {
    expect(analyses(building({ division: "M-3" }))).toEqual([
      "GUARD-not-covered",
    ]);
    expect(required(building({ division: "M-3" }))).toEqual([]);
  });

  it("sends several blocks, mixed use and high storage to specific analysis", () => {
    expect(analyses(building({ single_block: false }))).toEqual([
      "GUARD-multiple-blocks",
    ]);
    expect(
      analyses(building({ single_use: false, only_subsidiary: false })),
    ).toEqual(["GUARD-mixed-use"]);
    expect(analyses(building({ storage_over_3_5m: true }))).toEqual([
      "GUARD-storage-over-3-5m",
    ]);
  });

  it("lists no required system in those cases", () => {
    for (const facts of [
      building({ single_block: false }),
      building({ single_use: false, only_subsidiary: false }),
      building({ storage_over_3_5m: true }),
      building({ area_m2: 750 }),
    ]) {
      expect(required(facts)).toEqual([]);
    }
  });

  it("asks what is missing instead of listing systems", () => {
    const result = run({ division: "C-2" });
    expect(required({ division: "C-2" })).toEqual([]);
    expect(result.unanswered).toEqual(
      expect.arrayContaining([
        "area_m2",
        "storeys",
        "single_block",
        "single_use",
        "storage_over_3_5m",
      ]),
    );
  });

  it("is pending, not covered, when the division is unknown", () => {
    const result = run(building({ division: undefined }));
    expect(result.unanswered).toContain("division");
    expect(required(building({ division: undefined }))).toEqual([]);
  });
});

describe("Scope guards are declared per division", () => {
  it("makes every division classified by area and height declare the three guards", () => {
    for (const [id, keys] of Object.entries(DIVISION_SCOPE_GUARDS)) {
      if (/^[KM]-/.test(id)) continue;
      expect(keys).toEqual(["boundary", "multiple-blocks", "mixed-use"]);
    }
  });

  it("applies a guard only to the divisions that declare it", () => {
    const original = DIVISION_SCOPE_GUARDS["C-2"];
    DIVISION_SCOPE_GUARDS["C-2"] = ["mixed-use"];
    try {
      const boundary = declaresGuard("boundary");
      const outcome = (c: Condition, division: string) =>
        evaluateCondition(c, { division }).outcome;
      expect(outcome(boundary, "C-2")).toBe("false");
      expect(outcome(boundary, "C-1")).toBe("true");
      expect(outcome(declaresGuard("mixed-use"), "C-2")).toBe("true");
    } finally {
      DIVISION_SCOPE_GUARDS["C-2"] = original;
    }
  });
});
