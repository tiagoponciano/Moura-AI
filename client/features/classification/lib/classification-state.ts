import { pickFaults } from "./annex-d";
import { pickFacts } from "./answers";
import { pickEnlargement, type EnlargementAnswers } from "./enlargement-input";
import type { Facts } from "./engine/types";
import type { OccupationPart } from "./mixed-occupancy";
import { pickParts } from "./mixed-parts";

/** What a project keeps of its classification: the inputs, never the computed result. */
export type ClassificationState = {
  facts: Facts;
  parts: OccupationPart[];
  enlargement?: EnlargementAnswers;
  faults: string[];
};

export const EMPTY_STATE: ClassificationState = {
  facts: {},
  parts: [],
  faults: [],
};

/**
 * The state of a request or a saved row, each part checked on its own: an invalid
 * part is dropped without losing the others. Used on write and on read, so what
 * is stored can never carry more than the panel itself accepts.
 */
export function pickState(raw: unknown): ClassificationState {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    facts: pickFacts(source.facts),
    parts: pickParts(source.parts),
    enlargement: pickEnlargement(source.enlargement),
    faults: pickFaults(source.faults),
  };
}

/** Whether there is anything worth saving or showing. */
export function hasState(state: ClassificationState): boolean {
  return (
    Object.keys(state.facts).length > 0 ||
    state.parts.length > 0 ||
    state.enlargement !== undefined ||
    state.faults.length > 0
  );
}
