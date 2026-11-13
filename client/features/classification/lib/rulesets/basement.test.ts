import { describe, expect, it } from "vitest";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import { lintRules } from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import {
  BASEMENT_CASE_FACT,
  BASEMENT_RULES,
  basementMeasuresText,
} from "./basement";

const DATE = "2026-11-12";

const shop: Facts = {
  division: "C-2",
  area_m2: 700,
  storeys: 1,
  height_m: 0,
  fire_load_class: "medium",
  single_block: true,
  single_use: true,
  storage_over_3_5m: false,
  special_risks: false,
  risk_exempt: false,
  has_basement: true,
  basement_level: "first_second",
  basement_area_m2: 150,
  basement_use: "storage",
};
const caseOf = (o: Facts = {}) =>
  evaluateRules(ALL_RULES, { ...shop, ...o }, DATE).facts[BASEMENT_CASE_FACT];

describe("Tabela 30 rules", () => {
  it("are well formed, one per printed row", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    expect(BASEMENT_RULES).toHaveLength(14);
  });

  it("derive nothing without a basement", () => {
    expect(caseOf({ has_basement: false })).toBeUndefined();
  });

  it("splits the first and second basement at 100, 250 and 500 m²", () => {
    const at = (basement_area_m2: number, o: Facts = {}) =>
      caseOf({ basement_area_m2, ...o });
    expect(at(100)).toBe("first-b100-all");
    expect(at(100.1)).toBe("first-b250-storage");
    expect(at(250)).toBe("first-b250-storage");
    expect(at(250.1, { basement_use: "assembly" })).toBe("first-b500-assembly");
    expect(at(500, { basement_use: "other" })).toBe("first-b500-other");
    expect(at(500.1, { basement_use: "other" })).toBe("first-over500-other");
  });

  it("splits the deeper basements at 100 m²", () => {
    const at = (basement_area_m2: number, basement_use: string) =>
      caseOf({ basement_level: "other", basement_area_m2, basement_use });
    expect(at(100, "assembly")).toBe("other-b100-assembly");
    expect(at(100, "storage")).toBe("other-b100-storage");
    expect(at(100.1, "other")).toBe("other-over100-other");
  });

  it("reads a store above the limit as a depósito only in a residential building (note 5)", () => {
    const big = { basement_area_m2: 300 };
    for (const division of ["A-1", "A-2", "A-3"])
      expect(caseOf({ ...big, division })).toBe("first-b500-storage");
    expect(caseOf({ ...big, division: "C-2" })).toBe("first-b500-other");
  });

  it("reads assembly above 500 m² as another occupation, which has no row of its own", () => {
    expect(caseOf({ basement_area_m2: 600, basement_use: "assembly" })).toBe(
      "first-over500-other",
    );
  });

  it("asks for the basement answers only after the building is in scope", () => {
    const base = { ...shop, has_basement: undefined };
    expect(classify(base, DATE).nextQuestions.map((q) => q.fact)).toEqual([
      "has_basement",
    ]);
    const open = {
      ...shop,
      basement_level: undefined,
      basement_area_m2: undefined,
      basement_use: undefined,
    };
    expect(classify(open, DATE).nextQuestions.map((q) => q.fact)).toEqual([
      "basement_level",
      "basement_area_m2",
      "basement_use",
    ]);
  });
});

describe("Tabela 30 on screen", () => {
  it("shows the alternatives with the notes they cite and note 7", () => {
    const observation = classify(shop, DATE).observations.find((o) =>
      o.text.startsWith("Subsolo"),
    );
    expect(observation?.text).toContain("Depósitos individuais (nota 1)");
    expect(observation?.text).toContain(
      "Nota 1: As paredes dos compartimentos",
    );
    expect(observation?.text).toContain("Nota 7: Os subsolos das edificações");
    expect(observation?.source).toContain("Tabela 30");
  });

  it("says no additional measures up to 100 m²", () => {
    expect(basementMeasuresText("first-b100-all")).toContain(
      "Sem exigências adicionais",
    );
    expect(
      classify({ ...shop, basement_area_m2: 80 }, DATE).observations.length,
    ).toBeGreaterThan(0);
  });

  it("shows nothing without a basement", () => {
    expect(
      classify({ ...shop, has_basement: false }, DATE).observations,
    ).toEqual([]);
  });
});
