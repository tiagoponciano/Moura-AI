import { hasState, type ClassificationState } from "./classification-state";
import type { Classification, RiskView } from "./classify";
import { classifyWithParts } from "./mixed-parts";

/** What the project page shows of a saved classification. */
export type ClassificationSummary =
  | { status: "empty" }
  | {
      status: Classification["status"];
      risk?: RiskView;
      /** Labels of the required systems, in catalog order. */
      required: string[];
      /** Labels of the questions still to be answered. */
      missing: string[];
      progress: Classification["progress"];
    };

/**
 * The result of a saved classification, computed again from its inputs the way
 * the classification tab does, so both always agree. Nothing saved, or a state
 * with no answer, is `empty`.
 */
export function summarizeClassification(
  state: ClassificationState | null,
  analysisDate: string,
): ClassificationSummary {
  if (!state || !hasState(state)) return { status: "empty" };
  const result = classifyWithParts(state.facts, state.parts, analysisDate);
  return {
    status: result.status,
    risk: result.risk,
    required: result.groups.required.map((system) => system.label),
    missing: [
      ...new Set(result.nextQuestions.map((question) => question.label)),
    ],
    progress: result.progress,
  };
}
