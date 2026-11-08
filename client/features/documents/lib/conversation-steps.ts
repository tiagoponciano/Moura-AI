import { isEmptyValue } from "./form-values";
import type { FieldValues, TemplateField, TemplateSchema } from "./templates";

/** Extra `fill_fields` input the agent sets when the user says the current step does not apply. */
export const SKIP_STEP_FIELD = "skip_step";

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

/** The guide's steps when it fits the schema, otherwise the derived ones. */
export function conversationSteps(
  schema: TemplateSchema,
  guide?: ConversationGuide,
): ConversationStep[] {
  return guide && guideProblems(schema, guide).length === 0
    ? guide.steps
    : deriveSteps(schema);
}

export type StepProgress = {
  /** Position of the current step; equals `total` once every step is done. */
  index: number;
  total: number;
  step?: ConversationStep;
};

/**
 * The first step not done yet. A step is done when it was skipped, or when it
 * has at least one answer and every required non-boolean field in it is filled.
 */
export function stepProgress(
  schema: TemplateSchema,
  steps: ConversationStep[],
  values: FieldValues,
  skipped: number[] = [],
): StepProgress {
  const required = new Set(
    schema.fields
      .filter((field) => field.required && field.type !== "boolean")
      .map((field) => field.name),
  );
  const filled = (name: string) => !isEmptyValue(values[name]);
  const found = steps.findIndex(
    (step, index) =>
      !skipped.includes(index) &&
      !(
        step.fields.some(filled) &&
        step.fields.every((name) => !required.has(name) || filled(name))
      ),
  );
  const index = found === -1 ? steps.length : found;
  return { index, total: steps.length, step: steps[index] };
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
