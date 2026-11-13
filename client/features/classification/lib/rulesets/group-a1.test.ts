import { describe, expect, it } from "vitest";
import table3Json from "../../norms/in-1-p2/tables/table-03.json";
import { classify } from "../classify";
import { evaluateCondition } from "../engine/condition";
import { evaluateRules } from "../engine/evaluate-rules";
import { lintRules } from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_3_A1_SPEC } from "./group-a1";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";

const house = (o: Facts = {}): Facts => ({
  division: "A-1",
  a1_construction: "detached",
  area_m2: 180,
  storeys: 2,
  height_m: 5,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  shared_gas_shelter: false,
  lot_count: 0,
  ...o,
});
const run = (f: Facts) => evaluateRules(ALL_RULES, f, DATE);
const status = (f: Facts, id: string) =>
  run(f).systems.find((s) => s.id === id)?.status;
const analyses = (f: Facts) => run(f).specificAnalyses.map((a) => a.ruleId);

describe("A-1 rules", () => {
  it("are well formed", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
  });

  it("encode every note the A-1 cells cite", () => {
    const part0 = (table3Json as unknown as ExtractedTable).rows.filter(
      (r) => r.part === 0,
    );
    const cited = [
      ...new Set(part0.flatMap((r) => r.cells.flatMap((c) => c.refs))),
    ];
    for (const n of cited)
      expect(TABLE_3_A1_SPEC.notes.map((x) => x.number)).toContain(n);
  });

  it("names the table and the column", () => {
    expect(classify(house(), DATE).table).toBe(
      "Tabela 3 (A-1), coluna isolada",
    );
  });

  it("asks for the construction type", () => {
    expect(
      classify(house({ a1_construction: undefined }), DATE).nextQuestions.map(
        (q) => q.fact,
      ),
    ).toContain("a1_construction");
  });
});

describe("A-1: the three columns", () => {
  it("requires building isolation only between attached units (note 11)", () => {
    const f = (a1_construction: string) =>
      status(house({ a1_construction }), "building_isolation");
    expect(f("attached")).toBe("required");
    expect(f("detached")).toBe("not_required");
    expect(f("mixed_single_family")).toBe("not_required");
  });

  it("requires structural protection except for the detached house", () => {
    const f = (a1_construction: string) =>
      status(house({ a1_construction }), "structural_protection");
    expect(f("attached")).toBe("required");
    expect(f("detached")).toBe("not_required");
    expect(f("mixed_single_family")).toBe("required");
  });

  it("does not depend on area or height: no regime boundary, no multiple-blocks guard", () => {
    expect(analyses(house({ area_m2: 750, height_m: 5 }))).toEqual([]);
    expect(analyses(house({ single_block: false }))).toEqual([]);
  });
});

describe("A-1: notes", () => {
  it("requires fuel gas for a detached house only with a shared shelter (note 12)", () => {
    expect(
      status(house({ shared_gas_shelter: false }), "combustible_gas"),
    ).toBe("not_required");
    expect(status(house({ shared_gas_shelter: true }), "combustible_gas")).toBe(
      "required",
    );
  });

  it("requires urban hydrants above 350 lots (note 18)", () => {
    const f = (lot_count: number) =>
      status(house({ lot_count }), "urban_hydrants");
    expect(f(350)).toBe("not_required");
    expect(f(351)).toBe("required");
  });

  it("sends a mixed single-family unit of 6 m or more to specific analysis (note 13)", () => {
    const f = (height_m: number) =>
      analyses(house({ a1_construction: "mixed_single_family", height_m }));
    expect(f(5.9)).toEqual([]);
    expect(f(6)).toEqual(["GUARD-a1-mixed-over-6m"]);
  });

  it("leaves the mixed column at exactly 6 m, where the guard takes over", () => {
    const holding = (height_m: number) =>
      TABLE_3_A1_SPEC.columns.filter(
        (c) =>
          evaluateCondition(
            c.when,
            house({ a1_construction: "mixed_single_family", height_m }),
          ).outcome === "true",
      );
    expect(holding(5.9)).toHaveLength(1);
    expect(holding(6)).toHaveLength(0);
  });

  it("applies risk III to A-1 up to 21 m and 5.000 m²", () => {
    const level = (f: Facts) => {
      const r = run(f).risk;
      return r.status === "decided" ? r.level : r.status;
    };
    expect(level(house({ area_m2: 800, storeys: 4, height_m: 12 }))).toBe(
      "III",
    );
  });
});
