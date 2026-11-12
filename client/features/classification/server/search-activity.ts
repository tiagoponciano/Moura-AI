import { z } from "zod";
import { searchActivities } from "../lib/catalog/activities";

/** Input of the `search_activity` tool. */
export const searchActivityInput = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .describe("What the building is used for, in the user's own words"),
});

/**
 * Looks the description up in IN 3, Annex A. The model reads `matches` and `note`;
 * the chat's status line reads `summary`.
 */
export function searchActivity(input: { query: string }) {
  const matches = searchActivities(input.query, 5).map(({ activity }) => ({
    id: activity.id,
    division: activity.division,
    destination: activity.destination,
    fire_load_mj_m2: activity.qfi ?? null,
    fire_load_ref: activity.qfiRef ?? null,
  }));
  return {
    matches,
    note: matches.length
      ? "Ask the user which one is theirs, even if only one matches. Record its id as `activity` only after they confirm."
      : "Nothing in IN 3, Annex A matches. Tell the user the activity is not listed (the norm leaves it to similarity, which needs a professional) and record the division as `other`.",
    summary:
      matches.length === 0
        ? "Nenhuma atividade encontrada na IN 3"
        : `Atividades encontradas na IN 3: ${matches.length}`,
  };
}
