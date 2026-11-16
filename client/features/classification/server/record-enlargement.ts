import { z } from "zod";
import {
  divisionOf,
  enlargementAnswersSchema,
  enlargementFor,
  pickEnlargement,
} from "../lib/enlargement-input";
import type { Facts } from "../lib/engine/types";

/** Input of the `record_enlargement` tool: what the user said about the enlargement. */
export const recordEnlargementInput = z.object({
  originalAreaM2: enlargementAnswersSchema.shape.originalAreaM2.describe(
    "Original built area in square meters: the largest area up to 11/11/2013 for older buildings, or the area of the first approved fire plan",
  ),
  addedAreaM2: enlargementAnswersSchema.shape.addedAreaM2.describe(
    "Area added since that reference date, summed, in square meters; 0 when only the occupancy or the layout changes without more area",
  ),
  originalRegularized:
    enlargementAnswersSchema.shape.originalRegularized.describe(
      "True when the original area is regularized with the fire brigade",
    ),
  compartmented: enlargementAnswersSchema.shape.compartmented.describe(
    "True when there is compartmentation between the original and the enlarged area",
  ),
  newIsolatedBlock: enlargementAnswersSchema.shape.newIsolatedBlock.describe(
    "True when the enlargement made a new isolated block",
  ),
  graceYearsMet: enlargementAnswersSchema.shape.graceYearsMet.describe(
    "True when at least 5 years have passed since the occupancy permit of the original building",
  ),
  raisesRigor: enlargementAnswersSchema.shape.raisesRigor.describe(
    "True when the enlargement raises the rigor of the fire requirements, for example by crossing an area or height threshold",
  ),
});

/**
 * What the tool returns. The client reads `enlargement`; the model reads
 * `status` and `note`; the chat's status line reads `summary`.
 */
export function recordEnlargement(input: unknown, state: Facts) {
  const enlargement = pickEnlargement(input);
  const result = enlargementFor(state, enlargement);
  return {
    enlargement,
    status: !enlargement ? "invalid" : result ? "recorded" : "needs_division",
    note: !enlargement
      ? "The enlargement was not recorded: check every field."
      : result
        ? "Recorded. Do not explain the result; the panel shows it."
        : `Recorded, but the division is not known yet (${divisionOf(state) ?? "none"}). Ask for the activity first.`,
    summary: enlargement
      ? enlargement.addedAreaM2 === 0
        ? "Mudança sem ampliação registrada"
        : `Ampliação registrada: ${enlargement.addedAreaM2} m² sobre ${enlargement.originalAreaM2} m²`
      : "Ampliação não registrada",
  };
}
