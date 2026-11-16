import { z } from "zod";
import { applyAnswers, pickAnswers } from "../lib/answers";
import type { Facts } from "../lib/engine/types";
import { classifyWithParts } from "../lib/mixed-parts";
import type { OccupationPart } from "../lib/mixed-occupancy";
import { QUESTIONS, type Question } from "../lib/questions";

const UNKNOWN_FACTS = QUESTIONS.filter((q) => q.allowUnknown).map(
  (q) => q.fact,
) as [string, ...string[]];

function fieldSchema(question: Question): z.ZodType {
  if (question.kind === "activity") return z.string();
  if (question.kind === "boolean") return z.boolean();
  if (question.kind === "enum") {
    return z.enum(
      question.options.map((o) => o.value) as [string, ...string[]],
    );
  }
  const number = question.allowZero ? z.number().min(0) : z.number().positive();
  return question.integer ? number.int() : number;
}

/** Input of the `record_answers` tool, generated from the question registry. */
export const recordAnswersInput = z.object({
  ...Object.fromEntries(
    QUESTIONS.map((q) => [
      q.fact,
      fieldSchema(q).optional().describe(q.description),
    ]),
  ),
  unknown: z
    .array(z.enum(UNKNOWN_FACTS))
    .optional()
    .describe(
      "Facts the user said they do not know. Never guess them; list them here.",
    ),
});

/**
 * What the tool returns. The client reads `answers` and `unknown`; the model
 * reads `next` (what to ask now, in Portuguese) and `status`.
 */
export function recordAnswers(
  input: unknown,
  state: Facts,
  analysisDate: string,
  parts: OccupationPart[] = [],
) {
  const picked = pickAnswers(input);
  const result = classifyWithParts(
    applyAnswers(state, picked),
    parts,
    analysisDate,
  );
  return {
    answers: picked.values,
    unknown: picked.unknown,
    /** The fact ids shown in the chat as "Campos atualizados". */
    fields: [...Object.keys(picked.values), ...picked.unknown],
    status: result.status,
    next: result.next ? [result.next] : [],
  };
}
