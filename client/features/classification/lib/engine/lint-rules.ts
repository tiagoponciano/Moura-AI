import { evaluateCondition } from "./condition";
import { inForce, RISK_FACT } from "./evaluate-rules";
import type { Condition, Facts, Rule, Stage } from "./types";

export type LintIssue = { ruleIds: string[]; message: string };

const ALLOWED: Record<Stage, string[]> = {
  derive: ["set"],
  risk: ["set", "specificAnalysis"],
  systems: ["require", "substitute", "specificAnalysis"],
  overlay: ["overlay"],
};

const kindOf = (rule: Rule) => Object.keys(rule.then)[0];

/** Problems in a rule set that no single rule shows. Empty means the set is well formed. */
export function lintRules(rules: Rule[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const seen = new Map<string, Rule>();
  for (const rule of rules) {
    if (seen.has(rule.id)) {
      issues.push({ ruleIds: [rule.id], message: "duplicate rule id" });
    }
    seen.set(rule.id, rule);
    if (rule.validTo !== undefined && rule.validTo < rule.validFrom) {
      issues.push({
        ruleIds: [rule.id],
        message: "validTo is before validFrom",
      });
    }
    if (!rule.source.doc || !rule.source.locator) {
      issues.push({
        ruleIds: [rule.id],
        message: "the source has no doc or locator",
      });
    }
    if (!ALLOWED[rule.stage].includes(kindOf(rule))) {
      issues.push({
        ruleIds: [rule.id],
        message: `"${kindOf(rule)}" is not allowed in stage "${rule.stage}"`,
      });
    }
    if (
      rule.stage === "risk" &&
      "set" in rule.then &&
      rule.then.set.fact !== RISK_FACT
    ) {
      issues.push({
        ruleIds: [rule.id],
        message: `a risk rule must set "${RISK_FACT}"`,
      });
    }
  }

  // Rules that compete for one slot must say which comes first.
  const slots = new Map<string, Rule[]>();
  for (const rule of rules) {
    if (rule.stage === "derive" && "set" in rule.then) {
      const key = `derive:${rule.then.set.fact}:${rule.priority}`;
      slots.set(key, [...(slots.get(key) ?? []), rule]);
    }
    if (rule.stage === "risk") {
      const key = `risk:${rule.priority}`;
      slots.set(key, [...(slots.get(key) ?? []), rule]);
    }
  }
  for (const [key, group] of slots) {
    if (group.length > 1) {
      issues.push({
        ruleIds: group.map((r) => r.id),
        message: `same priority in "${key.split(":").slice(0, -1).join(":")}": order is undefined`,
      });
    }
  }
  return issues;
}

/**
 * Derive rules for one fact that are true together on a sample. Priority would
 * hide the overlap, so it is reported: a boundary that two rules both claim is
 * a decision for a person, not for rule order.
 */
export function findDeriveOverlaps(
  rules: Rule[],
  samples: Facts[],
  analysisDate: string,
): LintIssue[] {
  const derive = rules.filter(
    (rule) =>
      rule.stage === "derive" &&
      "set" in rule.then &&
      inForce(rule, analysisDate),
  );
  const found = new Map<string, LintIssue>();
  for (const sample of samples) {
    const byFact = new Map<string, Rule[]>();
    for (const rule of derive) {
      if (evaluateCondition(rule.when, sample).outcome !== "true") continue;
      const fact = (rule.then as { set: { fact: string } }).set.fact;
      byFact.set(fact, [...(byFact.get(fact) ?? []), rule]);
    }
    for (const [fact, matching] of byFact) {
      if (matching.length < 2) continue;
      const key = `${fact}:${matching.map((r) => r.id).join(",")}`;
      if (!found.has(key)) {
        found.set(key, {
          ruleIds: matching.map((r) => r.id),
          message: `both derive "${fact}" on ${JSON.stringify(sample)}`,
        });
      }
    }
  }
  return [...found.values()];
}

function collectThresholds(
  condition: Condition,
  into: Map<string, Set<number>>,
) {
  if ("all" in condition)
    condition.all.forEach((c) => collectThresholds(c, into));
  else if ("any" in condition)
    condition.any.forEach((c) => collectThresholds(c, into));
  else if ("not" in condition) collectThresholds(condition.not, into);
  else if (typeof condition.value === "number" && condition.op !== "eq") {
    into.set(
      condition.fact,
      (into.get(condition.fact) ?? new Set()).add(condition.value),
    );
  }
}

/** Every number a rule compares a fact with, per fact. */
export function numericThresholds(rules: Rule[]): Record<string, number[]> {
  const into = new Map<string, Set<number>>();
  for (const rule of rules) collectThresholds(rule.when, into);
  return Object.fromEntries(
    [...into].map(([fact, values]) => [
      fact,
      [...values].sort((a, b) => a - b),
    ]),
  );
}

/**
 * One sample per combination of "just below, exactly at, just above" each
 * threshold of each fact. Grows with the product of the thresholds, so use it
 * on one table's rules at a time.
 */
export function boundarySamples(rules: Rule[], step = 0.01): Facts[] {
  const thresholds = numericThresholds(rules);
  const values = Object.entries(thresholds).map(
    ([fact, list]) =>
      [
        fact,
        [...new Set(list.flatMap((t) => [t - step, t, t + step]))],
      ] as const,
  );
  return values.reduce<Facts[]>(
    (samples, [fact, options]) =>
      samples.flatMap((sample) =>
        options.map((value) => ({ ...sample, [fact]: value })),
      ),
    [{}],
  );
}
