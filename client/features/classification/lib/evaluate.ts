import { occupancyLabel, type Building, type BuildingField } from "./building";
import type { Condition, SystemRule } from "./rules";

export type RequirementStatus = "required" | "not_required" | "needs_info";

export type Requirement = {
  id: string;
  system: string;
  checks: string[];
  status: RequirementStatus;
  /** Why it is required (`required` only), in Portuguese. */
  reason?: string;
  /** Answers that would settle the rule (`needs_info` only). */
  missing: BuildingField[];
};

type Outcome = "true" | "false" | "unknown";

type CriterionResult = { outcome: Outcome; field: BuildingField; text: string };

function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

function criteria(condition: Condition, building: Building): CriterionResult[] {
  const results: CriterionResult[] = [];
  const compare = (
    field: "areaM2" | "heightM" | "floorCount",
    threshold: number | undefined,
    text: string,
  ) => {
    if (threshold === undefined) return;
    const value = building[field];
    results.push({
      field,
      text,
      outcome:
        value === undefined ? "unknown" : value > threshold ? "true" : "false",
    });
  };

  compare(
    "areaM2",
    condition.minAreaM2,
    `área acima de ${formatNumber(condition.minAreaM2 ?? 0)} m²`,
  );
  compare(
    "heightM",
    condition.minHeightM,
    `altura acima de ${formatNumber(condition.minHeightM ?? 0)} m`,
  );
  compare(
    "floorCount",
    condition.minFloorCount,
    `mais de ${condition.minFloorCount} pavimentos`,
  );
  if (condition.occupancies) {
    const value = building.occupancy;
    results.push({
      field: "occupancy",
      text: `ocupação ${condition.occupancies.map(occupancyLabel).join(", ").toLowerCase()}`,
      outcome:
        value === undefined
          ? "unknown"
          : condition.occupancies.includes(value)
            ? "true"
            : "false",
    });
  }
  return results;
}

function conditionOutcome(results: CriterionResult[]): Outcome {
  if (results.some((r) => r.outcome === "false")) return "false";
  if (results.some((r) => r.outcome === "unknown")) return "unknown";
  return "true";
}

/**
 * Applies one rule: required when any condition fully holds; needs_info when
 * none holds but some could once missing answers arrive; not_required otherwise.
 */
export function evaluateRule(
  rule: SystemRule,
  building: Building,
): Requirement {
  const base = { id: rule.id, system: rule.system, checks: rule.checks };

  if (rule.when.length === 0) {
    return {
      ...base,
      status: "required",
      reason: "vale para todas as edificações",
      missing: [],
    };
  }

  const evaluated = rule.when.map((condition) => {
    const results = criteria(condition, building);
    return { results, outcome: conditionOutcome(results) };
  });

  const met = evaluated.find((c) => c.outcome === "true");
  if (met) {
    return {
      ...base,
      status: "required",
      reason: met.results.map((r) => r.text).join(" e "),
      missing: [],
    };
  }

  const open = evaluated.filter((c) => c.outcome === "unknown");
  if (open.length > 0) {
    const missing = new Set<BuildingField>();
    for (const c of open)
      for (const r of c.results)
        if (r.outcome === "unknown") missing.add(r.field);
    return { ...base, status: "needs_info", missing: [...missing] };
  }

  return { ...base, status: "not_required", missing: [] };
}

export function evaluateBuilding(
  rules: SystemRule[],
  building: Building,
): Requirement[] {
  return rules.map((rule) => evaluateRule(rule, building));
}
