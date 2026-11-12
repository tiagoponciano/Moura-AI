import { evaluateCondition } from "./condition";
import type {
  Evaluation,
  Facts,
  Rule,
  RiskOutcome,
  Stage,
  SystemOutcome,
  TraceEntry,
} from "./types";

/** The fact the `risk` stage decides, for the `systems` rules to read. */
export const RISK_FACT = "risk_level";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value: string, what: string) {
  if (!ISO_DATE.test(value)) throw new RangeError(`${what} is not YYYY-MM-DD`);
}

/** Both ends are inclusive, so a rule is in force on its first and its last day. */
function inForce(rule: Rule, analysisDate: string): boolean {
  assertIsoDate(rule.validFrom, `Rule ${rule.id}: validFrom`);
  if (rule.validTo !== undefined) {
    assertIsoDate(rule.validTo, `Rule ${rule.id}: validTo`);
  }
  return (
    rule.validFrom <= analysisDate &&
    (rule.validTo === undefined || analysisDate <= rule.validTo)
  );
}

const byPriority = (a: Rule, b: Rule) =>
  a.priority - b.priority || a.id.localeCompare(b.id);

function misplaced(rule: Rule, stage: Stage): never {
  throw new TypeError(
    `Rule ${rule.id}: this result is not allowed in "${stage}"`,
  );
}

/**
 * Runs the rules in force on `analysisDate` over the facts, stage by stage:
 * derived facts, then the risk cascade, then the systems, then the labels for
 * existing buildings. It never decides anything a rule does not say.
 */
export function evaluateRules(
  rules: Rule[],
  facts: Facts,
  analysisDate: string,
): Evaluation {
  assertIsoDate(analysisDate, "analysisDate");
  const active = rules.filter((rule) => inForce(rule, analysisDate));
  const inStage = (stage: Stage) =>
    active.filter((rule) => rule.stage === stage).sort(byPriority);

  const working: Facts = { ...facts };
  const trace: TraceEntry[] = [];
  const evaluated: Rule[] = [];

  const run = (rule: Rule) => {
    const result = evaluateCondition(rule.when, working);
    trace.push({
      ruleId: rule.id,
      stage: rule.stage,
      outcome: result.outcome,
      missing: result.missing,
    });
    evaluated.push(rule);
    return result;
  };

  // Derived facts: first match per fact, and never over an answer.
  for (const rule of inStage("derive")) {
    if (!("set" in rule.then)) misplaced(rule, "derive");
    if (working[rule.then.set.fact] !== undefined) continue;
    if (run(rule).outcome === "true") {
      working[rule.then.set.fact] = rule.then.set.value;
    }
  }

  // Risk: an ordered cascade. A rule that cannot be evaluated stops it.
  let risk: RiskOutcome = { status: "no_rule" };
  const specificAnalyses: Evaluation["specificAnalyses"] = [];
  for (const rule of inStage("risk")) {
    const result = run(rule);
    if (result.outcome === "unknown") {
      risk = {
        status: "pending",
        blockedBy: rule.id,
        missing: result.missing,
      };
      break;
    }
    if (result.outcome === "false") continue;
    if ("specificAnalysis" in rule.then) {
      risk = {
        status: "specific_analysis",
        reason: rule.then.specificAnalysis,
        ruleId: rule.id,
      };
      specificAnalyses.push({
        ruleId: rule.id,
        reason: rule.then.specificAnalysis,
      });
    } else if ("set" in rule.then && rule.then.set.fact === RISK_FACT) {
      const level = String(rule.then.set.value);
      risk = { status: "decided", level, ruleId: rule.id };
      working[RISK_FACT] = level;
    } else {
      misplaced(rule, "risk");
    }
    break;
  }

  // Systems: required when any rule says so; pending when none does but one could not be settled.
  const requiredBy = new Map<
    string,
    { rules: string[]; vital: boolean; scopes: string[]; unscoped: boolean }
  >();
  const substitutes: {
    system: string;
    ruleId: string;
    by: string[];
    note?: string;
  }[] = [];
  const unsettled = new Map<string, { rules: string[]; missing: string[] }>();
  const order: string[] = [];
  const systemRules = inStage("systems");
  for (const rule of systemRules) {
    const result = run(rule);
    if ("specificAnalysis" in rule.then) {
      if (result.outcome === "true") {
        specificAnalyses.push({
          ruleId: rule.id,
          reason: rule.then.specificAnalysis,
        });
      }
      continue;
    }
    if ("substitute" in rule.then) {
      if (result.outcome === "true") {
        substitutes.push({
          system: rule.then.substitute,
          ruleId: rule.id,
          by: rule.then.by,
          note: rule.then.note,
        });
      }
      continue;
    }
    if (!("require" in rule.then)) misplaced(rule, "systems");
    const id = rule.then.require;
    if (!order.includes(id)) order.push(id);
    if (result.outcome === "true") {
      const entry = requiredBy.get(id) ?? {
        rules: [],
        vital: false,
        scopes: [],
        unscoped: false,
      };
      entry.rules.push(rule.id);
      entry.vital = entry.vital || rule.then.vital === true;
      if (rule.then.scope === undefined) entry.unscoped = true;
      else if (!entry.scopes.includes(rule.then.scope)) {
        entry.scopes.push(rule.then.scope);
      }
      requiredBy.set(id, entry);
    } else if (result.outcome === "unknown") {
      const entry = unsettled.get(id) ?? { rules: [], missing: [] };
      entry.rules.push(rule.id);
      entry.missing = [...new Set([...entry.missing, ...result.missing])];
      unsettled.set(id, entry);
    }
  }
  const systems: SystemOutcome[] = order.map((id) => {
    const required = requiredBy.get(id);
    if (required) {
      return {
        id,
        status: "required",
        vital: required.vital,
        scopes: required.scopes,
        partial: !required.unscoped,
        substitutions: [],
        ruleIds: required.rules,
        missing: [],
      };
    }
    const pending = unsettled.get(id);
    if (pending) {
      return {
        id,
        status: "needs_info",
        vital: false,
        scopes: [],
        partial: false,
        substitutions: [],
        ruleIds: pending.rules,
        missing: pending.missing,
      };
    }
    return {
      id,
      status: "not_required",
      vital: false,
      scopes: [],
      partial: false,
      substitutions: [],
      ruleIds: [],
      missing: [],
    };
  });

  // Substitutions: shown for required systems; never applied.
  for (const substitute of substitutes) {
    const system = systems.find((s) => s.id === substitute.system);
    if (system?.status !== "required") continue;
    system.substitutions.push({
      ruleId: substitute.ruleId,
      by: substitute.by,
      alreadyRequired: substitute.by.filter((id) =>
        systems.some((s) => s.id === id && s.status === "required"),
      ),
      note: substitute.note,
    });
  }

  // Overlay: labels only systems that are already required; it can never add one.
  for (const rule of inStage("overlay")) {
    const then = rule.then;
    if (!("overlay" in then)) misplaced(rule, "overlay");
    const result = run(rule);
    if (result.outcome !== "true") continue;
    const system = systems.find((s) => s.id === then.overlay);
    if (system?.status === "required" && system.overlayClass === undefined) {
      system.overlayClass = then.class;
    }
  }

  const missingFacts = [
    ...new Set(
      trace.filter((t) => t.outcome === "unknown").flatMap((t) => t.missing),
    ),
  ];
  return {
    facts: working,
    risk,
    systems,
    systemsCovered: systemRules.length > 0,
    specificAnalyses,
    declaredUnknown: missingFacts.filter((fact) => working[fact] === null),
    unanswered: missingFacts.filter((fact) => working[fact] === undefined),
    provisional: evaluated.some((rule) => rule.status !== "approved"),
    trace,
  };
}
