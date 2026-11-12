import { describe, expect, it } from "vitest";
import type { Condition } from "./engine/types";
import { GROUP_C_RULES } from "./rulesets/group-c";
import {
  ASKABLE_QUESTIONS,
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
      "storage_over_3_5m",
    ]);
  });
});
