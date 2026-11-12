import { evaluateRules } from "./engine/evaluate-rules";
import type { Facts, Rule } from "./engine/types";
import { ASKABLE_QUESTIONS, type Question } from "./questions";
import { GROUP_C_RULES } from "./rulesets/group-c";
import { HEIGHT_CLASSES } from "./rulesets/group-c-conditions";
import { SYSTEMS, systemLabel } from "./rulesets/systems";

/** The printed source of a decision, for "why is this required?". */
export type Reason = { locator: string; quote?: string };

export type SystemView = {
  id: string;
  label: string;
  status: "required" | "needs_info" | "not_required";
  vital: boolean;
  /** Required only in part of the building; `scopes` says which parts. */
  partial: boolean;
  scopes: string[];
  substitutions: { by: string[]; alreadyRequired: string[]; note?: string }[];
  reasons: Reason[];
  /** Observations from the notes that do not change whether it is required. */
  notes: string[];
  /** Labels of the answers that would settle a `needs_info` system. */
  missing: string[];
};

export type Classification = {
  /**
   * `analysis`: the rules stop at a specific analysis and no system is listed.
   * `pending`: something is unanswered or "não sei". `complete`: nothing is missing.
   */
  status: "analysis" | "pending" | "complete";
  analyses: (Reason & { reason: string })[];
  /** Which table and column applied, once known. */
  table?: string;
  groups: {
    required: SystemView[];
    needsInfo: SystemView[];
    notRequired: SystemView[];
  };
  nextQuestions: Question[];
  declaredUnknown: Question[];
  progress: { answered: number; total: number };
  provisional: boolean;
};

const CATALOG_ORDER = Object.keys(SYSTEMS);

function tableHint(facts: Facts): string | undefined {
  if (facts.regime === "small") return "Tabela 2 (imóvel até 750 m² e 12 m)";
  if (facts.regime !== "large") return undefined;
  const column = HEIGHT_CLASSES.find((h) => h.id === facts.height_class);
  return column ? `Tabela 5, coluna ${column.label}` : "Tabela 5";
}

/** Runs the rules over the answers and shapes the result for the screen. */
export function classify(
  answers: Facts,
  analysisDate: string,
  rules: Rule[] = GROUP_C_RULES,
): Classification {
  const evaluation = evaluateRules(rules, answers, analysisDate);
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const reasonOf = (id: string): Reason => {
    const source = byId.get(id)?.source;
    return { locator: source?.locator ?? id, quote: source?.quote };
  };

  const nextQuestions = ASKABLE_QUESTIONS.filter((q) =>
    evaluation.unanswered.includes(q.fact),
  );
  const declaredUnknown = ASKABLE_QUESTIONS.filter((q) =>
    evaluation.declaredUnknown.includes(q.fact),
  );
  const labelOf = (fact: string) =>
    ASKABLE_QUESTIONS.find((q) => q.fact === fact)?.label ?? fact;

  const analyses = evaluation.specificAnalyses.map((a) => ({
    reason: a.reason,
    ...reasonOf(a.ruleId),
  }));

  const views: SystemView[] = evaluation.systems.map((system) => {
    const rulesOf = system.ruleIds.map((id) => byId.get(id));
    const seen = new Set<string>();
    const reasons = system.ruleIds
      .map(reasonOf)
      .filter((r) => !seen.has(r.locator) && seen.add(r.locator));
    return {
      id: system.id,
      label: systemLabel(system.id),
      status: system.status,
      vital: system.vital,
      partial: system.partial,
      scopes: system.scopes,
      substitutions: system.substitutions.map((s) => ({
        by: s.by.map(systemLabel),
        alreadyRequired: s.alreadyRequired.map(systemLabel),
        note: s.note,
      })),
      reasons: system.status === "needs_info" ? [] : reasons,
      notes: [
        ...new Set(rulesOf.flatMap((rule) => (rule?.note ? [rule.note] : []))),
      ],
      missing: system.missing.map(labelOf),
    };
  });
  views.sort(
    (a, b) => CATALOG_ORDER.indexOf(a.id) - CATALOG_ORDER.indexOf(b.id),
  );

  // A specific analysis replaces the list: the tables behind it say "not required" for a case they do not settle.
  const listed = analyses.length === 0 ? views : [];
  const answered = ASKABLE_QUESTIONS.filter(
    (q) => answers[q.fact] !== undefined,
  ).length;

  return {
    status:
      analyses.length > 0
        ? "analysis"
        : nextQuestions.length > 0 || declaredUnknown.length > 0
          ? "pending"
          : "complete",
    analyses,
    table: tableHint(evaluation.facts),
    groups: {
      required: listed.filter((s) => s.status === "required"),
      needsInfo: listed.filter((s) => s.status === "needs_info"),
      notRequired: listed.filter((s) => s.status === "not_required"),
    },
    nextQuestions,
    declaredUnknown,
    progress: { answered, total: answered + nextQuestions.length },
    provisional: evaluation.provisional,
  };
}
