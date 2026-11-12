/**
 * What the engine knows about a building. `null` is an explicit "não sei"; a
 * missing key is a question not answered yet. Both make a rule unknown, but the
 * result tells them apart.
 */
export type FactValue = number | string | boolean | null;
export type Facts = Record<string, FactValue | undefined>;

/** One comparison on one fact. Every operator is explicit: nothing is "greater than" by default. */
export type Leaf =
  | { fact: string; op: "lt" | "lte" | "gt" | "gte"; value: number }
  | { fact: string; op: "eq"; value: number | string | boolean }
  | { fact: string; op: "in"; value: (number | string)[] };

export type Condition =
  Leaf | { all: Condition[] } | { any: Condition[] } | { not: Condition };

/** Where a rule comes from; the quote is the passage a reviewer checks it against. */
export type RuleSource = { doc: string; locator: string; quote?: string };

export type OverlayClass = "vital" | "indispensable" | "adaptable";

export type RuleResult =
  /** Derive a fact (occupancy group, fire load class, risk level…). */
  | { set: { fact: string; value: FactValue } }
  /**
   * The system is required. `scope` says it applies only to part of the
   * building ("atrium over 12 m"); without it, to the whole building.
   */
  | { require: string; vital?: boolean; scope?: string }
  /**
   * The norm lets `by` replace the system under the same condition. Display
   * only: the engine never drops the system because of it.
   */
  | { substitute: string; by: string[]; note?: string }
  /** Label an already required system for an existing building. */
  | { overlay: string; class: OverlayClass }
  /** The norm leaves this case to a specific analysis; the engine never decides it. */
  | { specificAnalysis: string };

/**
 * `derive` rules set facts, first match per fact. `risk` rules are an ordered
 * cascade. `systems` rules say which systems are required. `overlay` rules
 * only label systems `systems` already required.
 */
export type Stage = "derive" | "risk" | "systems" | "overlay";

export type Rule = {
  id: string;
  name: string;
  version: string;
  /** ISO date, inclusive. */
  validFrom: string;
  /** ISO date, inclusive; absent while the rule is in force. */
  validTo?: string;
  stage: Stage;
  /** Lower runs first. */
  priority: number;
  when: Condition;
  then: RuleResult;
  note?: string;
  source: RuleSource;
  /** Only `approved` rules lift the provisional marker. */
  status: "approved" | "provisional";
};

export type Tri = "true" | "false" | "unknown";

export type TraceEntry = {
  ruleId: string;
  stage: Stage;
  outcome: Tri;
  /** Facts that made the rule unknown. */
  missing: string[];
};

export type RiskOutcome =
  | { status: "decided"; level: string; ruleId: string }
  /** A rule before the deciding one could not be evaluated, so nothing later may decide. */
  | { status: "pending"; blockedBy: string; missing: string[] }
  | { status: "specific_analysis"; reason: string; ruleId: string }
  /** No active risk rule matched; never read as "no risk". */
  | { status: "no_rule" };

export type Substitution = {
  ruleId: string;
  /** Systems the norm accepts instead. */
  by: string[];
  /** The ones of `by` that are already required for this building. */
  alreadyRequired: string[];
  note?: string;
};

export type SystemOutcome = {
  id: string;
  status: "required" | "not_required" | "needs_info";
  vital: boolean;
  /** Parts of the building the requirement is limited to; empty for the whole building. */
  scopes: string[];
  /** True when every rule that required it is limited to a part of the building. */
  partial: boolean;
  /** Replacements the norm allows; only for required systems. */
  substitutions: Substitution[];
  overlayClass?: OverlayClass;
  /** Rules that required it, or that could not be settled. */
  ruleIds: string[];
  missing: string[];
};

export type Evaluation = {
  /** The input facts plus the ones derived. */
  facts: Facts;
  risk: RiskOutcome;
  systems: SystemOutcome[];
  /** False when no `systems` rule was in force: an empty list is then not "nothing required". */
  systemsCovered: boolean;
  specificAnalyses: { ruleId: string; reason: string }[];
  /** Facts a person said "não sei" to, and that some rule needed. */
  declaredUnknown: string[];
  /** Facts never answered, and that some rule needed. */
  unanswered: string[];
  /** True while any rule that took part is not approved. */
  provisional: boolean;
  trace: TraceEntry[];
};
