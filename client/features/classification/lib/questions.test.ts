import { describe, expect, it } from "vitest";
import type { Condition } from "./engine/types";
import { GROUP_C_RULES } from "./rulesets/group-c";
import {
  ASKABLE_QUESTIONS,
  nextAsk,
  QUESTION_BY_FACT,
  QUESTIONS,
  type Question,
} from "./questions";

/** Facts the rules derive themselves, so nobody is asked for them. */
const DERIVED = new Set(["regime", "height_class"]);

function leaves(condition: Condition): { fact: string; value: unknown }[] {
  if ("all" in condition) return condition.all.flatMap(leaves);
  if ("any" in condition) return condition.any.flatMap(leaves);
  if ("not" in condition) return leaves(condition.not);
  return [{ fact: condition.fact, value: condition.value }];
}

describe("question registry", () => {
  it("has one question per fact", () => {
    expect(new Set(QUESTIONS.map((q) => q.fact)).size).toBe(QUESTIONS.length);
  });

  it("has a question for every fact the Grupo C rules read", () => {
    const read = new Set(
      GROUP_C_RULES.flatMap((rule) => leaves(rule.when).map((l) => l.fact)),
    );
    for (const fact of read) {
      if (DERIVED.has(fact)) continue;
      expect(QUESTION_BY_FACT.has(fact), `no question for "${fact}"`).toBe(
        true,
      );
    }
  });

  it("offers every value of a category the rules compare with", () => {
    const options = (fact: string) =>
      (
        QUESTION_BY_FACT.get(fact) as Extract<Question, { kind: "enum" }>
      ).options.map((o) => o.value);
    for (const rule of GROUP_C_RULES) {
      for (const { fact, value } of leaves(rule.when)) {
        if (fact !== "division" && fact !== "fire_load_class") continue;
        for (const v of Array.isArray(value) ? value : [value]) {
          expect(options(fact), `${fact}=${String(v)} in ${rule.id}`).toContain(
            v,
          );
        }
      }
    }
  });

  it("writes the questions in Portuguese and the model descriptions in English", () => {
    for (const q of QUESTIONS) {
      expect(q.ask.endsWith("?") || q.ask.endsWith(".")).toBe(true);
      expect(q.description).not.toMatch(/[áàâãéêíóôõúç]/i);
    }
  });

  it("does not ask for the alternative way to give the fire load", () => {
    expect(ASKABLE_QUESTIONS.map((q) => q.fact)).not.toContain(
      "fire_load_mj_m2",
    );
  });

  it("allows não sei only where a professional may have to answer", () => {
    const unknownOk = QUESTIONS.filter((q) => q.allowUnknown).map(
      (q) => q.fact,
    );
    expect(unknownOk).toEqual([
      "fire_load_class",
      "single_block",
      "single_use",
      "only_subsidiary",
      "storage_over_3_5m",
      "special_risks",
      "hazardous_substances",
      "glp_kg",
      "flammable_internal_l",
      "flammable_external_m3",
      "combustible_liquid_m3",
      "power_plant_type",
      "combustible_liquid_storage",
      "solid_fuel_storage_m2",
      "public_road_within_50m",
      "m2_installation",
      "m2_liquid_m3",
      "m2_gas_quantity",
      "hose_reach_60m",
      "silo_support_area_m2",
      "greenhouse_uses_gas",
      "gas_suppression_system",
      "isotank_total_m3",
      "storage_area_m2",
      "capacity_people",
      "ends_by_18h",
      "windowless",
      "classrooms_exit_outside",
      "risk_exempt",
    ]);
  });
});

describe("nextAsk", () => {
  const ask = (facts: string[]) =>
    nextAsk(facts.map((f) => QUESTION_BY_FACT.get(f)!));

  it("asks nothing when nothing is open", () => {
    expect(nextAsk([])).toBeUndefined();
  });

  it("asks the first question on its own when it is not a scope confirmation", () => {
    expect(ask(["storeys", "single_block", "single_use"])).toEqual({
      ask: "Quantos pavimentos tem o imóvel?",
      facts: ["storeys"],
    });
  });

  it("asks one question for every scope confirmation still open", () => {
    expect(ask(["single_block", "single_use", "storage_over_3_5m"])).toEqual({
      ask: "O imóvel é um bloco só (sem outras edificações no terreno), tem uma só atividade (sem outra ocupação misturada) e não tem armazenamento acima de 3,5 m? Se algum desses pontos não for verdade, diga qual.",
      facts: ["single_block", "single_use", "storage_over_3_5m"],
    });
  });

  it("joins only the confirmations still open", () => {
    expect(ask(["single_use", "storage_over_3_5m"])).toEqual({
      ask: "O imóvel tem uma só atividade (sem outra ocupação misturada) e não tem armazenamento acima de 3,5 m? Se algum desses pontos não for verdade, diga qual.",
      facts: ["single_use", "storage_over_3_5m"],
    });
  });

  it("asks a lone scope confirmation with its own wording", () => {
    expect(ask(["storage_over_3_5m"])).toEqual({
      ask: "Existe armazenamento de materiais com mais de 3,5 m de altura?",
      facts: ["storage_over_3_5m"],
    });
  });

  it("marks only the scope facts, with the value that keeps the building in scope", () => {
    const scoped = QUESTIONS.filter((q) => q.scope).map((q) => [
      q.fact,
      q.scope!.inScope,
    ]);
    expect(scoped).toEqual([
      ["single_block", true],
      ["single_use", true],
      ["storage_over_3_5m", false],
      ["special_risks", false],
      ["risk_exempt", false],
    ]);
  });
});
