import { ACTIVITY_BY_ID } from "./catalog/activities";
import { divisionLabel } from "./catalog/occupations";
import { evaluateRules } from "./engine/evaluate-rules";
import type { Facts, Rule } from "./engine/types";
import {
  ASKABLE_QUESTIONS,
  nextAsk,
  type NextAsk,
  type Question,
} from "./questions";
import { ALL_RULES } from "./rulesets/all-rules";
import { BASEMENT_CASE_FACT, basementMeasuresText } from "./rulesets/basement";
import { FIRE_LOAD_CLASSES } from "./rulesets/group-c-conditions";
import { RISK_PROCESS } from "./rulesets/group-c-risk";
import { tableHint } from "./table-hint";
import { SYSTEMS, systemLabel } from "./rulesets/systems";

/** The printed source of a decision, for "why is this required?". */
export type Reason = { locator: string; quote?: string };

/** A value the rules got from the chosen activity instead of from the user. */
export type Derived = { label: string; value: string; source: string };

/** The risk level I–V and what it means for the process, once the rules settle it. */
export type RiskView =
  | { status: "decided"; level: string; process: string; reason: Reason }
  | { status: "pending" }
  | { status: "not_covered" };

/** Something the norm adds to the result without changing which systems are listed. */
export type Observation = { text: string; source: string };

export type SystemView = {
  id: string;
  label: string;
  status: "required" | "needs_info" | "not_required";
  vital: boolean;
  /** IN 5 class of the system for an existing or recent building; absent otherwise. */
  treatment?: "vital" | "indispensable" | "adaptable";
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
  /** Absent while a specific analysis replaces the result. */
  risk?: RiskView;
  /** What the norm adds when the other occupations are only subsidiary (art. 10). */
  observations: Observation[];
  groups: {
    required: SystemView[];
    needsInfo: SystemView[];
    notRequired: SystemView[];
  };
  /** Values taken from the chosen activity (IN 3, Annex A). */
  derived: Derived[];
  /** The activity points one way and an answer another; the answer wins. */
  conflicts: string[];
  nextQuestions: Question[];
  /** What the assistant asks now; one question can cover several of `nextQuestions`. */
  next?: NextAsk;
  declaredUnknown: Question[];
  progress: { answered: number; total: number };
  provisional: boolean;
};

const CATALOG_ORDER = Object.keys(SYSTEMS);

/** IN 1 parte 2, art. 10: what applies when the other occupations are subsidiary. */
const SUBSIDIARY_OBSERVATIONS: Observation[] = [
  {
    text: "Os sistemas e medidas da ocupação predominante, e o seu dimensionamento, valem também para as ocupações subsidiárias.",
    source: "IN 1 parte 2, art. 10",
  },
  {
    text: "Pavimentos e áreas destinados a garagem devem ser compartimentados em relação aos acessos, às escadas e à descarga da edificação, mesmo que a compartimentação não seja exigida para a ocupação predominante. Garagem térrea com aberturas de ventilação permanente acima de 50% da área das laterais, em pelo menos 2 faces opostas, pode ser dispensada (§ 2º). Em subsolo sem a ventilação mínima, a dispensa exige detecção automática, chuveiros automáticos e barreira eficaz contra a propagação de gases e fumaça (§ 3º).",
    source: "IN 1 parte 2, art. 10, §§ 1º a 3º",
  },
];

/** The additional measures of Tabela 30 for the basement, once its row is known. */
function basementObservations(facts: Facts): Observation[] {
  const key = facts[BASEMENT_CASE_FACT];
  const text = typeof key === "string" ? basementMeasuresText(key) : undefined;
  return text
    ? [
        {
          text: `Subsolo, medidas adicionais: ${text}`,
          source: "IN 1 parte 2, Anexo B, Tabela 30",
        },
      ]
    : [];
}

/** Runs the rules over the answers and shapes the result for the screen. */
export function classify(
  answers: Facts,
  analysisDate: string,
  rules: Rule[] = ALL_RULES,
): Classification {
  // The activity fills the division and the fire load unless the user already gave them.
  const facts: Facts = { ...answers };
  const derived: Derived[] = [];
  const conflicts: string[] = [];
  const activity =
    typeof answers.activity === "string"
      ? ACTIVITY_BY_ID.get(answers.activity)
      : undefined;
  const fromActivity = activity
    ? `IN 3, Anexo A · ${activity.division} ${activity.destination}`
    : "";
  if (activity) {
    if (answers.division === undefined) {
      facts.division = activity.division;
      derived.push({
        label: "Divisão",
        value: divisionLabel(activity.division),
        source: fromActivity,
      });
    } else if (answers.division !== activity.division) {
      conflicts.push(
        `A atividade "${activity.destination}" é da divisão ${activity.division}, mas a divisão informada é ${String(answers.division)}.`,
      );
    }
    if (activity.qfi !== undefined) {
      if (
        answers.fire_load_class === undefined &&
        answers.fire_load_mj_m2 === undefined
      ) {
        facts.fire_load_mj_m2 = activity.qfi;
      }
    } else if (activity.qfiRef) {
      derived.push({
        label: "Carga de incêndio",
        value: `a norma remete ao ${activity.qfiRef}`,
        source: fromActivity,
      });
    }
  }
  const evaluation = evaluateRules(rules, facts, analysisDate);
  if (
    activity?.qfi !== undefined &&
    facts.fire_load_mj_m2 === activity.qfi &&
    answers.fire_load_mj_m2 === undefined
  ) {
    const cls = FIRE_LOAD_CLASSES.find(
      (c) => c.id === evaluation.facts.fire_load_class,
    );
    derived.push({
      label: "Carga de incêndio",
      value: `${activity.qfi.toLocaleString("pt-BR")} MJ/m²${cls ? ` (${cls.label.toLowerCase()})` : ""}`,
      source: fromActivity,
    });
  }
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const reasonOf = (id: string): Reason => {
    const source = byId.get(id)?.source;
    return { locator: source?.locator ?? id, quote: source?.quote };
  };

  const nextQuestions = ASKABLE_QUESTIONS.filter(
    (q) =>
      evaluation.unanswered.includes(q.fact) &&
      (!q.askAfter || facts[q.askAfter.fact] === q.askAfter.value),
  );
  const declaredUnknown = ASKABLE_QUESTIONS.filter((q) =>
    evaluation.declaredUnknown.includes(q.fact),
  );
  // A pending answer is named only once it can be asked (see `askAfter`).
  const isAskable = (fact: string) => {
    const q = ASKABLE_QUESTIONS.find((item) => item.fact === fact);
    return !!q && (!q.askAfter || facts[q.askAfter.fact] === q.askAfter.value);
  };
  const labelOf = (fact: string) =>
    ASKABLE_QUESTIONS.find((q) => q.fact === fact)?.label ?? fact;

  const analyses = evaluation.specificAnalyses.map((a) => ({
    reason: a.reason,
    ...reasonOf(a.ruleId),
  }));

  const riskOutcome = evaluation.risk;
  const risk: RiskView =
    riskOutcome.status === "decided"
      ? {
          status: "decided",
          level: riskOutcome.level,
          process: RISK_PROCESS[riskOutcome.level] ?? "",
          reason: reasonOf(riskOutcome.ruleId),
        }
      : riskOutcome.status === "pending"
        ? { status: "pending" }
        : { status: "not_covered" };

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
      treatment: system.overlayClass,
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
      missing: system.missing.filter(isAskable).map(labelOf),
    };
  });
  views.sort(
    (a, b) => CATALOG_ORDER.indexOf(a.id) - CATALOG_ORDER.indexOf(b.id),
  );

  // A specific analysis replaces the list: the tables behind it say "not required" for a case they do not settle.
  const listed = analyses.length === 0 ? views : [];
  const answered = ASKABLE_QUESTIONS.filter(
    (q) => facts[q.fact] !== undefined,
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
    risk: analyses.length === 0 ? risk : undefined,
    observations:
      analyses.length === 0
        ? [
            ...(facts.single_use === false && facts.only_subsidiary === true
              ? SUBSIDIARY_OBSERVATIONS
              : []),
            ...basementObservations(evaluation.facts),
          ]
        : [],
    groups: {
      required: listed.filter((s) => s.status === "required"),
      needsInfo: listed.filter((s) => s.status === "needs_info"),
      notRequired: listed.filter((s) => s.status === "not_required"),
    },
    derived,
    conflicts,
    nextQuestions,
    next: nextAsk(nextQuestions),
    declaredUnknown,
    progress: { answered, total: answered + nextQuestions.length },
    provisional: evaluation.provisional,
  };
}
