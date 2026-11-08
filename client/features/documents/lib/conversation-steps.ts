import type { TemplateField, TemplateSchema } from "./templates";

/** Most fields the agent asks about in one step. */
export const MAX_STEP_FIELDS = 6;

export type ConversationStep = {
  fields: string[];
  /** Hand-written question for the step (UI copy, Portuguese). */
  question?: string;
};

/** A form's `<id>.guide.json`: steps written by hand, replacing the derived ones. */
export type ConversationGuide = {
  steps: ConversationStep[];
};

/**
 * Splits a form into the steps the agent goes through, in document order.
 * Consecutive `( )` marks share a step, and the field right after them joins
 * it, since it usually completes the last mark ("Tem RE" + "RE").
 */
export function deriveSteps(schema: TemplateSchema): ConversationStep[] {
  const steps: ConversationStep[] = [];
  let current: TemplateField[] = [];

  const close = () => {
    if (current.length) steps.push({ fields: current.map((f) => f.name) });
    current = [];
  };

  for (const field of schema.fields) {
    const marks = current.filter((f) => f.mark).length;
    const plain = current.length - marks;
    const full = current.length >= MAX_STEP_FIELDS;

    if (field.mark) {
      if (plain > 0 || full) close();
    } else if (marks > 0) {
      if (plain > 0 || full) close();
    } else if (full) {
      close();
    }
    current.push(field);
  }
  close();
  return steps;
}

/** The guide's steps when the form has one, otherwise the derived ones. */
export function conversationSteps(
  schema: TemplateSchema,
  guide?: ConversationGuide,
): ConversationStep[] {
  return guide ? guide.steps : deriveSteps(schema);
}

/** What makes a guide unusable for its schema; empty when it is valid. */
export function guideProblems(
  schema: TemplateSchema,
  guide: ConversationGuide,
): string[] {
  const known = new Set(schema.fields.map((field) => field.name));
  const seen = new Set<string>();
  const problems: string[] = [];

  for (const name of guide.steps.flatMap((step) => step.fields)) {
    if (!known.has(name)) problems.push(`Unknown field: ${name}`);
    else if (seen.has(name)) problems.push(`Field in two steps: ${name}`);
    seen.add(name);
  }
  for (const name of known) {
    if (!seen.has(name)) problems.push(`Field in no step: ${name}`);
  }
  return problems;
}
