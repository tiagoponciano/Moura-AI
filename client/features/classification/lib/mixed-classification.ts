import type { Classification, SystemView } from "./classify";
import type { Facts, Rule } from "./engine/types";
import { classifyMixed, type MixedInput } from "./mixed-occupancy";
import { ASKABLE_QUESTIONS, nextAsk } from "./questions";
import { ALL_RULES } from "./rulesets/all-rules";
import { RISK_PROCESS } from "./rulesets/group-c-risk";
import { SYSTEMS } from "./rulesets/systems";
import { reasonOf, systemView } from "./system-view";

const CATALOG_ORDER = Object.keys(SYSTEMS);
const SOURCE = "IN 1 parte 2, arts. 10 a 12";

/** What the user says about the building as a whole; the parts bring their own area, height and storeys. */
export type MixedBuilding = MixedInput;

/**
 * The screen's classification of a building with more than one occupation:
 * `classifyMixed` joined per system, shaped like the single-occupation result so
 * the same panel shows it. Questions are the ones the rules still need; the area,
 * height, storeys and division come from the parts, so they are never asked.
 */
export function classifyMixedBuilding(
  input: MixedBuilding,
  analysisDate: string,
  rules: Rule[] = ALL_RULES,
): Classification {
  const result = classifyMixed(input, analysisDate, rules);
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const facts: Facts = input.base;

  const evaluations = result.parts.map((p) => p.evaluation);
  const open = (fact: string, partFacts: Facts) => {
    const question = ASKABLE_QUESTIONS.find((q) => q.fact === fact);
    return (
      !!question &&
      (!question.askAfter ||
        partFacts[question.askAfter.fact] === question.askAfter.value)
    );
  };
  const askable = (listOf: (e: (typeof evaluations)[number]) => string[]) =>
    ASKABLE_QUESTIONS.filter((q) =>
      result.parts.some(
        (p) =>
          listOf(p.evaluation).includes(q.fact) &&
          open(q.fact, p.evaluation.facts),
      ),
    );
  const nextQuestions = askable((e) => e.unanswered);
  const declaredUnknown = askable((e) => e.declaredUnknown);
  const isAskable = (fact: string) =>
    nextQuestions.some((q) => q.fact === fact);
  const labelOf = (fact: string) =>
    ASKABLE_QUESTIONS.find((q) => q.fact === fact)?.label ?? fact;

  const analyses = result.parts.flatMap((p) =>
    p.evaluation.specificAnalyses.map((a) => ({
      reason: `${p.division}: ${a.reason}`,
      ...reasonOf(byId, a.ruleId),
    })),
  );

  const views: SystemView[] = result.systems.map((merged) => ({
    ...systemView(merged.outcome, { byId, isAskable, labelOf }),
    status: merged.status,
    vital: merged.vital,
    scopes: merged.scopes,
    partial: merged.status === "required" && merged.scopes.length > 0,
  }));
  views.sort(
    (a, b) => CATALOG_ORDER.indexOf(a.id) - CATALOG_ORDER.indexOf(b.id),
  );
  const listed = analyses.length === 0 ? views : [];
  const answered = ASKABLE_QUESTIONS.filter(
    (q) => facts[q.fact] !== undefined,
  ).length;
  const predominant = evaluations[0].risk;

  return {
    status:
      analyses.length > 0
        ? "analysis"
        : nextQuestions.length > 0 || declaredUnknown.length > 0
          ? "pending"
          : "complete",
    analyses,
    risk:
      analyses.length > 0
        ? undefined
        : predominant.status === "decided"
          ? {
              status: "decided",
              level: predominant.level,
              process: RISK_PROCESS[predominant.level] ?? "",
              reason: reasonOf(byId, predominant.ruleId),
            }
          : predominant.status === "pending"
            ? { status: "pending" }
            : { status: "not_covered" },
    observations: result.notes.map((text) => ({ text, source: SOURCE })),
    groups: {
      required: listed.filter((s) => s.status === "required"),
      needsInfo: listed.filter((s) => s.status === "needs_info"),
      notRequired: listed.filter((s) => s.status === "not_required"),
    },
    derived: [],
    conflicts: [],
    nextQuestions,
    next: nextAsk(nextQuestions),
    declaredUnknown,
    progress: { answered, total: answered + nextQuestions.length },
    provisional: true,
  };
}
