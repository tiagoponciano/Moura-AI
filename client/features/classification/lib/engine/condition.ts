import type { Condition, Facts, Tri } from "./types";

export type ConditionResult = { outcome: Tri; missing: string[] };

const unique = (items: string[]) => [...new Set(items)];

/**
 * Evaluates a condition against the facts in three values. A fact that is
 * missing or "não sei" makes a comparison unknown; `all` is false as soon as
 * one part is false, and `any` is true as soon as one part is true, even when
 * another part is unknown.
 */
export function evaluateCondition(
  condition: Condition,
  facts: Facts,
): ConditionResult {
  if ("all" in condition) {
    const results = condition.all.map((part) => evaluateCondition(part, facts));
    if (results.some((r) => r.outcome === "false")) {
      return { outcome: "false", missing: [] };
    }
    const unknown = results.filter((r) => r.outcome === "unknown");
    if (unknown.length > 0) {
      return {
        outcome: "unknown",
        missing: unique(unknown.flatMap((r) => r.missing)),
      };
    }
    return { outcome: "true", missing: [] };
  }

  if ("any" in condition) {
    const results = condition.any.map((part) => evaluateCondition(part, facts));
    if (results.some((r) => r.outcome === "true")) {
      return { outcome: "true", missing: [] };
    }
    const unknown = results.filter((r) => r.outcome === "unknown");
    if (unknown.length > 0) {
      return {
        outcome: "unknown",
        missing: unique(unknown.flatMap((r) => r.missing)),
      };
    }
    return { outcome: "false", missing: [] };
  }

  if ("not" in condition) {
    const result = evaluateCondition(condition.not, facts);
    if (result.outcome === "unknown") return result;
    return {
      outcome: result.outcome === "true" ? "false" : "true",
      missing: [],
    };
  }

  const value = facts[condition.fact];
  if (value === undefined || value === null) {
    return { outcome: "unknown", missing: [condition.fact] };
  }

  const holds = (() => {
    switch (condition.op) {
      case "eq":
        return value === condition.value;
      case "in":
        return (condition.value as (number | string)[]).includes(
          value as number | string,
        );
      default: {
        if (typeof value !== "number") {
          throw new TypeError(`Fact "${condition.fact}" is not a number`);
        }
        if (condition.op === "lt") return value < condition.value;
        if (condition.op === "lte") return value <= condition.value;
        if (condition.op === "gt") return value > condition.value;
        return value >= condition.value;
      }
    }
  })();
  return { outcome: holds ? "true" : "false", missing: [] };
}
