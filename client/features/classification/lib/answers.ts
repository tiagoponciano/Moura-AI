import type { Facts, FactValue } from "./engine/types";
import { ACTIVITY_BY_ID } from "./catalog/activities";
import { QUESTION_BY_FACT, QUESTIONS, type Question } from "./questions";

/** Answers picked from a tool output: values, and the facts the user said "não sei" to. */
export type PickedAnswers = { values: Facts; unknown: string[] };

function valid(question: Question, value: unknown): FactValue | undefined {
  if (question.kind === "activity") {
    return typeof value === "string" && ACTIVITY_BY_ID.has(value)
      ? value
      : undefined;
  }
  if (question.kind === "boolean") {
    return typeof value === "boolean" ? value : undefined;
  }
  if (question.kind === "enum") {
    return typeof value === "string" &&
      question.options.some((option) => option.value === value)
      ? value
      : undefined;
  }
  const floor = question.allowZero ? 0 : Number.MIN_VALUE;
  if (typeof value !== "number" || !Number.isFinite(value) || value < floor) {
    return undefined;
  }
  return question.integer && !Number.isInteger(value) ? undefined : value;
}

/**
 * Keeps only what the registry accepts: a known fact, a value of its type, and
 * "não sei" only where it is allowed. Anything else is dropped, never repaired.
 */
export function pickAnswers(output: unknown): PickedAnswers {
  const empty: PickedAnswers = { values: {}, unknown: [] };
  if (!output || typeof output !== "object") return empty;
  const source = output as Record<string, unknown>;
  const raw =
    source.answers && typeof source.answers === "object"
      ? (source.answers as Record<string, unknown>)
      : source;

  const values: Facts = {};
  for (const question of QUESTIONS) {
    const picked = valid(question, raw[question.fact]);
    if (picked !== undefined) values[question.fact] = picked;
  }
  const unknown = Array.isArray(source.unknown)
    ? [
        ...new Set(
          source.unknown.filter(
            (fact): fact is string =>
              typeof fact === "string" &&
              QUESTION_BY_FACT.get(fact)?.allowUnknown === true &&
              !(fact in values),
          ),
        ),
      ]
    : [];
  return { values, unknown };
}

/** The facts after applying picked answers; "não sei" becomes `null`. */
export function applyAnswers(current: Facts, picked: PickedAnswers): Facts {
  const next: Facts = { ...current, ...picked.values };
  for (const fact of picked.unknown) next[fact] = null;
  return next;
}

/** A value typed in the panel, checked like a tool answer; an empty or invalid one clears the fact. */
export function applyEdit(current: Facts, fact: string, value: unknown): Facts {
  const question = QUESTION_BY_FACT.get(fact);
  const next = { ...current };
  if (!question) return next;
  if (value === null && question.allowUnknown) next[fact] = null;
  else {
    const picked = valid(question, value);
    if (picked === undefined) delete next[fact];
    else next[fact] = picked;
  }
  return next;
}

/** The facts to send with a chat message: known values only, validated. */
export function pickFacts(raw: unknown): Facts {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const facts: Facts = {};
  for (const question of QUESTIONS) {
    const value = source[question.fact];
    if (value === null && question.allowUnknown) facts[question.fact] = null;
    else {
      const picked = valid(question, value);
      if (picked !== undefined) facts[question.fact] = picked;
    }
  }
  return facts;
}
