import { z } from "zod";
import { ACTIVITY_BY_ID } from "./catalog/activities";
import { classifyEnlargement, type EnlargementResult } from "./enlargement";
import type { Facts } from "./engine/types";

/** What the user says about an enlargement; the division comes from the answers. */
export const enlargementAnswersSchema = z.object({
  originalAreaM2: z.number().positive(),
  addedAreaM2: z.number().positive(),
  originalRegularized: z.boolean(),
  compartmented: z.boolean(),
  newIsolatedBlock: z.boolean(),
  graceYearsMet: z.boolean(),
  raisesRigor: z.boolean(),
});

export type EnlargementAnswers = z.infer<typeof enlargementAnswersSchema>;

/** The enlargement of a request or a tool result, or `undefined` when it does not fit. */
export function pickEnlargement(raw: unknown): EnlargementAnswers | undefined {
  const parsed = enlargementAnswersSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

/** The division the answers settle, directly or through the chosen activity. */
export function divisionOf(answers: Facts): string | undefined {
  if (typeof answers.division === "string") return answers.division;
  return typeof answers.activity === "string"
    ? ACTIVITY_BY_ID.get(answers.activity)?.division
    : undefined;
}

/** The regime of the enlargement, once it is recorded and the division is known. */
export function enlargementFor(
  answers: Facts,
  enlargement: EnlargementAnswers | undefined,
): EnlargementResult | undefined {
  const division = divisionOf(answers);
  if (!enlargement || !division) return undefined;
  return classifyEnlargement({ ...enlargement, division });
}
