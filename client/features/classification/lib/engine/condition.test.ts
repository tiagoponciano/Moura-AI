import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./condition";
import type { Condition } from "./types";

const outcome = (
  condition: Condition,
  facts: Record<string, never | number | string | boolean | null | undefined>,
) => evaluateCondition(condition, facts).outcome;

describe("evaluateCondition: comparisons at the threshold", () => {
  // For each operator: exactly at the limit, just below and just above.
  const cases = [
    { op: "gt", at: "false", below: "false", above: "true" },
    { op: "gte", at: "true", below: "false", above: "true" },
    { op: "lt", at: "false", below: "true", above: "false" },
    { op: "lte", at: "true", below: "true", above: "false" },
  ] as const;

  for (const { op, at, below, above } of cases) {
    it(`${op}: exactly at, just below and just above 750`, () => {
      const condition: Condition = { fact: "area_m2", op, value: 750 };
      expect(outcome(condition, { area_m2: 750 })).toBe(at);
      expect(outcome(condition, { area_m2: 749.99 })).toBe(below);
      expect(outcome(condition, { area_m2: 750.01 })).toBe(above);
    });
  }

  it("eq compares strictly", () => {
    const condition: Condition = { fact: "group", op: "eq", value: "C" };
    expect(outcome(condition, { group: "C" })).toBe("true");
    expect(outcome(condition, { group: "D" })).toBe("false");
  });

  it("in matches any listed value", () => {
    const condition: Condition = {
      fact: "division",
      op: "in",
      value: ["C-1", "C-2"],
    };
    expect(outcome(condition, { division: "C-2" })).toBe("true");
    expect(outcome(condition, { division: "C-3" })).toBe("false");
  });

  it("refuses to compare a non-number with a numeric operator", () => {
    expect(() =>
      evaluateCondition({ fact: "group", op: "gt", value: 1 }, { group: "C" }),
    ).toThrow('Fact "group" is not a number');
  });
});

describe("evaluateCondition: unknown facts", () => {
  const leaf: Condition = { fact: "area_m2", op: "gt", value: 750 };

  it("is unknown when the fact is missing, naming it", () => {
    expect(evaluateCondition(leaf, {})).toEqual({
      outcome: "unknown",
      missing: ["area_m2"],
    });
  });

  it("is unknown when the fact is a declared não sei", () => {
    expect(outcome(leaf, { area_m2: null })).toBe("unknown");
  });

  it("all is false when one part is false, even if another is unknown", () => {
    const condition: Condition = {
      all: [leaf, { fact: "height_m", op: "gt", value: 12 }],
    };
    expect(evaluateCondition(condition, { area_m2: 100 })).toEqual({
      outcome: "false",
      missing: [],
    });
  });

  it("all is unknown when nothing is false but a part is unknown", () => {
    const condition: Condition = {
      all: [leaf, { fact: "height_m", op: "gt", value: 12 }],
    };
    expect(evaluateCondition(condition, { area_m2: 900 })).toEqual({
      outcome: "unknown",
      missing: ["height_m"],
    });
  });

  it("any is true when one part is true, even if another is unknown", () => {
    const condition: Condition = {
      any: [leaf, { fact: "height_m", op: "gt", value: 12 }],
    };
    expect(outcome(condition, { area_m2: 900 })).toBe("true");
  });

  it("any is unknown when nothing is true but a part is unknown", () => {
    const condition: Condition = {
      any: [leaf, { fact: "height_m", op: "gt", value: 12 }],
    };
    expect(outcome(condition, { area_m2: 100 })).toBe("unknown");
  });

  it("not keeps unknown unknown and flips the rest", () => {
    expect(outcome({ not: leaf }, {})).toBe("unknown");
    expect(outcome({ not: leaf }, { area_m2: 900 })).toBe("false");
    expect(outcome({ not: leaf }, { area_m2: 100 })).toBe("true");
  });

  it("an empty all is true and an empty any is false", () => {
    expect(outcome({ all: [] }, {})).toBe("true");
    expect(outcome({ any: [] }, {})).toBe("false");
  });
});
