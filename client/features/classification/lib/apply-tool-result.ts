import { pickFaults } from "./annex-d";
import { applyAnswers, applyEdit, pickAnswers } from "./answers";
import type { ClassificationState } from "./classification-state";
import { pickEnlargement } from "./enlargement-input";
import { pickParts } from "./mixed-parts";
import {
  RECORD_ANSWERS_TOOL,
  RECORD_ENLARGEMENT_TOOL,
  RECORD_FAULTS_TOOL,
  RECORD_PARTS_TOOL,
} from "./questions";

export type StateChange = {
  next: ClassificationState;
  /** The facts the change touched, for the source tag of each. */
  touched: string[];
};

const field = (output: unknown, name: string) =>
  (output as Record<string, unknown> | null)?.[name];

/**
 * The state after a tool result, or `undefined` when the result changes nothing.
 * The list tools send the whole list and the answers tool only what is new, so a
 * replayed chat ends with the same state however many times it is applied.
 */
export function applyToolResult(
  current: ClassificationState,
  toolName: string,
  output: unknown,
): StateChange | undefined {
  switch (toolName) {
    case RECORD_FAULTS_TOOL:
      return {
        next: { ...current, faults: pickFaults(field(output, "faults")) },
        touched: [],
      };
    case RECORD_ENLARGEMENT_TOOL:
      return {
        next: {
          ...current,
          enlargement: pickEnlargement(field(output, "enlargement")),
        },
        touched: [],
      };
    case RECORD_PARTS_TOOL:
      return {
        next: { ...current, parts: pickParts(field(output, "parts")) },
        touched: [],
      };
    case RECORD_ANSWERS_TOOL: {
      const picked = pickAnswers(output);
      const touched = [...Object.keys(picked.values), ...picked.unknown];
      if (touched.length === 0) return undefined;
      return {
        next: { ...current, facts: applyAnswers(current.facts, picked) },
        touched,
      };
    }
    default:
      return undefined;
  }
}

/** The state after a value typed in the panel; `null` is "não sei" and `undefined` clears the answer. */
export function applyPanelEdit(
  current: ClassificationState,
  fact: string,
  value: unknown,
): ClassificationState {
  return { ...current, facts: applyEdit(current.facts, fact, value) };
}
