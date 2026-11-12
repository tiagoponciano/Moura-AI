import { describe, expect, it } from "vitest";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
  numericThresholds,
} from "./lint-rules";
import type { Condition, Rule, RuleResult, Stage } from "./types";

const DATE = "2026-11-12";

function rule(
  id: string,
  stage: Stage,
  when: Condition,
  then: RuleResult,
  extra: Partial<Rule> = {},
): Rule {
  return {
    id,
    name: id,
    version: "test",
    validFrom: "2026-01-01",
    stage,
    priority: 10,
    when,
    then,
    source: { doc: "TEST", locator: id },
    status: "approved",
    ...extra,
  };
}

const area = (op: "lt" | "lte" | "gt" | "gte", value: number): Condition => ({
  fact: "area_m2",
  op,
  value,
});
const regime = (value: string): RuleResult => ({
  set: { fact: "regime", value },
});

describe("lintRules", () => {
  it("accepts a well formed set", () => {
    const rules = [
      rule("a", "derive", area("lt", 750), regime("small")),
      rule("b", "derive", area("gt", 750), regime("large"), { priority: 20 }),
      rule("s", "systems", { all: [] }, { require: "extinguishers" }),
    ];
    expect(lintRules(rules)).toEqual([]);
  });

  it("flags a duplicate id", () => {
    const rules = [
      rule("a", "systems", { all: [] }, { require: "x" }),
      rule("a", "systems", { all: [] }, { require: "y" }),
    ];
    expect(lintRules(rules)).toEqual([
      { ruleIds: ["a"], message: "duplicate rule id" },
    ]);
  });

  it("flags a validity that ends before it starts", () => {
    const rules = [
      rule(
        "a",
        "systems",
        { all: [] },
        { require: "x" },
        { validTo: "2025-12-31" },
      ),
    ];
    expect(lintRules(rules)[0].message).toBe("validTo is before validFrom");
  });

  it("flags a source with no locator", () => {
    const rules = [
      rule(
        "a",
        "systems",
        { all: [] },
        { require: "x" },
        {
          source: { doc: "IN-1-P2", locator: "" },
        },
      ),
    ];
    expect(lintRules(rules)[0].message).toBe(
      "the source has no doc or locator",
    );
  });

  it("flags a result that does not belong to the stage", () => {
    const rules = [rule("a", "derive", { all: [] }, { require: "x" })];
    expect(lintRules(rules)[0].message).toBe(
      '"require" is not allowed in stage "derive"',
    );
  });

  it("flags a risk rule that sets another fact", () => {
    const rules = [
      rule("a", "risk", { all: [] }, { set: { fact: "other", value: "II" } }),
    ];
    expect(lintRules(rules)[0].message).toBe(
      'a risk rule must set "risk_level"',
    );
  });

  it("flags two derive rules for one fact with the same priority", () => {
    const rules = [
      rule("a", "derive", area("lt", 750), regime("small")),
      rule("b", "derive", area("gt", 750), regime("large")),
    ];
    expect(lintRules(rules)).toEqual([
      {
        ruleIds: ["a", "b"],
        message: 'same priority in "derive:regime": order is undefined',
      },
    ]);
  });

  it("allows the same priority for derive rules of different facts", () => {
    const rules = [
      rule("a", "derive", area("lt", 750), regime("small")),
      rule("b", "derive", area("gt", 750), {
        set: { fact: "other", value: 1 },
      }),
    ];
    expect(lintRules(rules)).toEqual([]);
  });

  it("flags two risk rules with the same priority", () => {
    const set = (v: string): RuleResult => ({
      set: { fact: "risk_level", value: v },
    });
    const rules = [
      rule("a", "risk", area("lt", 1), set("I")),
      rule("b", "risk", area("gt", 1), set("II")),
    ];
    expect(lintRules(rules)[0].message).toBe(
      'same priority in "risk": order is undefined',
    );
  });
});

describe("findDeriveOverlaps", () => {
  it("catches the boundary two rules both claim: area <= 750 and area >= 750", () => {
    const rules = [
      rule("small", "derive", area("lte", 750), regime("small"), {
        priority: 1,
      }),
      rule("large", "derive", area("gte", 750), regime("large"), {
        priority: 2,
      }),
    ];
    const issues = findDeriveOverlaps(rules, boundarySamples(rules), DATE);
    expect(issues).toEqual([
      {
        ruleIds: ["small", "large"],
        message: 'both derive "regime" on {"area_m2":750}',
      },
    ]);
  });

  it("finds nothing when the rules are disjoint at every boundary", () => {
    const rules = [
      rule("small", "derive", area("lt", 750), regime("small"), {
        priority: 1,
      }),
      rule("large", "derive", area("gt", 750), regime("large"), {
        priority: 2,
      }),
      rule(
        "edge",
        "derive",
        { fact: "area_m2", op: "eq", value: 750 },
        regime("edge"),
        {
          priority: 3,
        },
      ),
    ];
    expect(findDeriveOverlaps(rules, boundarySamples(rules), DATE)).toEqual([]);
  });

  it("ignores rules that are not in force on the date", () => {
    const rules = [
      rule("small", "derive", area("lte", 750), regime("small"), {
        priority: 1,
      }),
      rule("large", "derive", area("gte", 750), regime("large"), {
        priority: 2,
        validFrom: "2030-01-01",
      }),
    ];
    expect(findDeriveOverlaps(rules, [{ area_m2: 750 }], DATE)).toEqual([]);
  });
});

describe("numericThresholds and boundarySamples", () => {
  const rules = [
    rule(
      "a",
      "systems",
      {
        all: [
          area("gt", 3000),
          {
            any: [
              { fact: "height_m", op: "gte", value: 12 },
              { fact: "group", op: "eq", value: "C" },
            ],
          },
        ],
      },
      { require: "x" },
    ),
    rule("b", "systems", { not: area("lte", 750) }, { require: "y" }),
  ];

  it("collects every number compared with a fact and skips equality", () => {
    expect(numericThresholds(rules)).toEqual({
      area_m2: [750, 3000],
      height_m: [12],
    });
  });

  it("builds samples just below, at and just above each threshold", () => {
    const samples = boundarySamples(rules);
    const areas = new Set(samples.map((s) => s.area_m2));
    expect(areas).toEqual(
      new Set([749.99, 750, 750.01, 2999.99, 3000, 3000.01]),
    );
    expect(samples).toHaveLength(6 * 3);
  });
});
