import { describe, expect, it } from "vitest";
import { evaluateRules } from "./evaluate-rules";
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

const always: Condition = { all: [] };
const area = (op: "gt" | "lte", value: number): Condition => ({
  fact: "area_m2",
  op,
  value,
});

describe("evaluateRules: derived facts", () => {
  const rules = [
    rule(
      "group-c",
      "derive",
      { fact: "activity", op: "eq", value: "shop" },
      {
        set: { fact: "group", value: "C" },
      },
    ),
    rule(
      "group-d",
      "derive",
      always,
      { set: { fact: "group", value: "D" } },
      {
        priority: 20,
      },
    ),
  ];

  it("sets a fact from the first matching rule only", () => {
    const result = evaluateRules(rules, { activity: "shop" }, DATE);
    expect(result.facts.group).toBe("C");
  });

  it("never overwrites an answer, not even a não sei", () => {
    expect(
      evaluateRules(rules, { activity: "shop", group: "A" }, DATE).facts.group,
    ).toBe("A");
    expect(
      evaluateRules(rules, { activity: "shop", group: null }, DATE).facts.group,
    ).toBeNull();
  });

  it("feeds later rules with the derived fact", () => {
    const systems = [
      ...rules,
      rule(
        "ext",
        "systems",
        { fact: "group", op: "eq", value: "C" },
        { require: "extinguishers" },
      ),
    ];
    const result = evaluateRules(systems, { activity: "shop" }, DATE);
    expect(result.systems[0]).toMatchObject({
      id: "extinguishers",
      status: "required",
    });
  });
});

describe("evaluateRules: the risk cascade", () => {
  const risk = (id: string, priority: number, when: Condition, level: string) =>
    rule(
      id,
      "risk",
      when,
      { set: { fact: "risk_level", value: level } },
      { priority },
    );

  const cascade = [
    risk("risk-v", 1, { fact: "explosives", op: "eq", value: true }, "V"),
    risk("risk-ii", 3, area("lte", 750), "II"),
    risk("risk-iv", 9, always, "IV"),
  ];

  it("decides with the first true rule", () => {
    const result = evaluateRules(
      cascade,
      { explosives: false, area_m2: 500 },
      DATE,
    );
    expect(result.risk).toEqual({
      status: "decided",
      level: "II",
      ruleId: "risk-ii",
    });
  });

  it("falls through to the last rule when nothing earlier matches", () => {
    const result = evaluateRules(
      cascade,
      { explosives: false, area_m2: 900 },
      DATE,
    );
    expect(result.risk).toMatchObject({ status: "decided", level: "IV" });
  });

  it("does not let a later rule decide when an earlier one is unknown", () => {
    // Risk V cannot be ruled out, so risk II must not be returned even though it matches.
    const result = evaluateRules(cascade, { area_m2: 500 }, DATE);
    expect(result.risk).toEqual({
      status: "pending",
      blockedBy: "risk-v",
      missing: ["explosives"],
    });
  });

  it("reports no_rule when no active rule matches, never a level", () => {
    const result = evaluateRules([cascade[1]], { area_m2: 900 }, DATE);
    expect(result.risk).toEqual({ status: "no_rule" });
  });

  it("stops at a specific analysis instead of classifying", () => {
    const rules = [
      rule(
        "special",
        "risk",
        { fact: "explosives", op: "eq", value: true },
        {
          specificAnalysis: "Explosivos exigem análise específica",
        },
        { priority: 1 },
      ),
      cascade[2],
    ];
    const result = evaluateRules(rules, { explosives: true }, DATE);
    expect(result.risk).toMatchObject({
      status: "specific_analysis",
      ruleId: "special",
    });
    expect(result.specificAnalyses).toHaveLength(1);
  });

  it("lets the systems rules read the decided level", () => {
    const rules = [
      ...cascade,
      rule(
        "sprinklers",
        "systems",
        { fact: "risk_level", op: "eq", value: "IV" },
        { require: "sprinklers" },
      ),
    ];
    const result = evaluateRules(
      rules,
      { explosives: false, area_m2: 900 },
      DATE,
    );
    expect(result.systems[0]).toMatchObject({
      id: "sprinklers",
      status: "required",
    });
  });
});

describe("evaluateRules: systems", () => {
  const rules = [
    rule("ext-small", "systems", area("lte", 750), {
      require: "extinguishers",
      vital: true,
    }),
    rule("ext-big", "systems", area("gt", 750), { require: "extinguishers" }),
    rule("alarm", "systems", area("gt", 1500), { require: "alarm" }),
  ];

  it("requires a system when any of its rules is true and keeps the vital flag", () => {
    const result = evaluateRules(rules, { area_m2: 500 }, DATE);
    expect(result.systems.find((s) => s.id === "extinguishers")).toMatchObject({
      status: "required",
      vital: true,
      ruleIds: ["ext-small"],
    });
    expect(result.systems.find((s) => s.id === "alarm")?.status).toBe(
      "not_required",
    );
  });

  it("needs info, naming the facts, when no rule is true and one is unknown", () => {
    const result = evaluateRules(rules, {}, DATE);
    expect(result.systems.find((s) => s.id === "alarm")).toMatchObject({
      status: "needs_info",
      missing: ["area_m2"],
    });
    expect(result.unanswered).toEqual(["area_m2"]);
  });

  it("tells a não sei from an unanswered question", () => {
    const result = evaluateRules(rules, { area_m2: null }, DATE);
    expect(result.declaredUnknown).toEqual(["area_m2"]);
    expect(result.unanswered).toEqual([]);
  });

  it("a true rule settles the system even if another rule for it is unknown", () => {
    const mixed = [
      rule(
        "a",
        "systems",
        { fact: "x", op: "eq", value: true },
        { require: "s" },
      ),
      rule(
        "b",
        "systems",
        { fact: "y", op: "eq", value: true },
        { require: "s" },
      ),
    ];
    const result = evaluateRules(mixed, { x: true }, DATE);
    expect(result.systems[0]).toMatchObject({
      status: "required",
      ruleIds: ["a"],
    });
  });

  it("says the systems are not covered when no systems rule is in force", () => {
    const result = evaluateRules([], { area_m2: 500 }, DATE);
    expect(result.systems).toEqual([]);
    expect(result.systemsCovered).toBe(false);
  });
});

describe("evaluateRules: existing-building overlay", () => {
  const rules = [
    rule("ext", "systems", always, { require: "extinguishers" }),
    rule("ov-ext", "overlay", always, {
      overlay: "extinguishers",
      class: "vital",
    }),
    rule("ov-alarm", "overlay", always, {
      overlay: "alarm",
      class: "indispensable",
    }),
  ];

  it("labels a required system", () => {
    const result = evaluateRules(rules, {}, DATE);
    expect(result.systems[0].overlayClass).toBe("vital");
  });

  it("never adds a system that was not required", () => {
    const result = evaluateRules(rules, {}, DATE);
    expect(result.systems.map((s) => s.id)).toEqual(["extinguishers"]);
  });
});

describe("evaluateRules: validity", () => {
  const limited = rule(
    "r",
    "systems",
    always,
    { require: "s" },
    {
      validFrom: "2026-06-25",
      validTo: "2026-12-31",
    },
  );

  it.each([
    ["2026-06-24", false],
    ["2026-06-25", true],
    ["2026-12-31", true],
    ["2027-01-01", false],
  ])("on %s the rule is in force: %s", (date, inForce) => {
    expect(evaluateRules([limited], {}, date).systems.length === 1).toBe(
      inForce,
    );
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() => evaluateRules([limited], {}, "12/11/2026")).toThrow(
      RangeError,
    );
  });
});

describe("evaluateRules: provenance", () => {
  it("is provisional while any evaluated rule is not approved", () => {
    const rules = [
      rule("r", "systems", always, { require: "s" }, { status: "provisional" }),
    ];
    expect(evaluateRules(rules, {}, DATE).provisional).toBe(true);
  });

  it("is not provisional when every evaluated rule is approved", () => {
    const rules = [rule("r", "systems", always, { require: "s" })];
    expect(evaluateRules(rules, {}, DATE).provisional).toBe(false);
  });

  it("traces every evaluated rule with its outcome", () => {
    const rules = [
      rule("yes", "systems", always, { require: "a" }),
      rule("no", "systems", area("gt", 99999), { require: "b" }),
    ];
    const result = evaluateRules(rules, { area_m2: 10 }, DATE);
    expect(result.trace.map((t) => [t.ruleId, t.outcome])).toEqual([
      ["no", "false"],
      ["yes", "true"],
    ]);
  });

  it("refuses a result that does not belong to the rule's stage", () => {
    const bad = rule("bad", "systems", always, {
      set: { fact: "x", value: 1 },
    });
    expect(() => evaluateRules([bad], {}, DATE)).toThrow(
      'not allowed in "systems"',
    );
  });
});
