import { z } from "zod";
import type { Facts } from "../lib/engine/types";
import {
  classifyWithParts,
  MAX_PARTS,
  occupationPartSchema,
  pickParts,
} from "../lib/mixed-parts";

/** Input of the `record_parts` tool: the whole list of occupations, predominant first. */
export const recordPartsInput = z.object({
  parts: z
    .array(
      occupationPartSchema.extend({
        division: occupationPartSchema.shape.division.describe(
          "Division of the occupation, like C-2",
        ),
        area_m2: occupationPartSchema.shape.area_m2.describe(
          "Area the occupation takes, in square meters",
        ),
        top_height_m: occupationPartSchema.shape.top_height_m.describe(
          "Height of the last floor of this occupation, in meters, from the lowest occupied floor",
        ),
        storeys: occupationPartSchema.shape.storeys.describe(
          "Number of storeys of this occupation",
        ),
        separation: occupationPartSchema.shape.separation.describe(
          "isolated, compartmented, or open (neither isolated nor compartmented) in relation to the other occupations",
        ),
        largest_floor_share_pct:
          occupationPartSchema.shape.largest_floor_share_pct.describe(
            "Optional. The largest share, in percent, of any one floor of the building that this occupation takes, for a secondary occupation. Ask for it when a secondary occupation is small overall but could fill most of a floor. Leave it out when unknown",
          ),
        role: occupationPartSchema.shape.role.describe(
          "Only for towers over a shared base: podium for the lower floors that join the towers, tower for each tower isolated from the others. Leave it out otherwise. A tower needs a podium",
        ),
      }),
    )
    .min(2)
    .max(MAX_PARTS)
    .describe(
      "Every occupation of the building, the predominant one first. It replaces the list recorded before, so always send all of them.",
    ),
});

/**
 * What the tool returns. The client reads `parts`; the model reads `next` and
 * `status`; the chat's status line reads `summary`.
 */
export function recordParts(
  input: unknown,
  state: Facts,
  analysisDate: string,
) {
  const parts = pickParts((input as { parts?: unknown } | null)?.parts);
  const result = classifyWithParts(state, parts, analysisDate);
  return {
    parts,
    status: result.status,
    next: result.next ? [result.next] : [],
    summary:
      parts.length === 0
        ? "Ocupações não registradas"
        : `Ocupações registradas: ${parts.map((p) => p.division).join(", ")}`,
  };
}
