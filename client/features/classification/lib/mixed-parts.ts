import { z } from "zod";
import { classify, type Classification } from "./classify";
import type { Facts, Rule } from "./engine/types";
import { classifyMixedBuilding } from "./mixed-classification";
import type { MixedKind, OccupationPart } from "./mixed-occupancy";
import { ALL_RULES } from "./rulesets/all-rules";
import { FIRE_LOAD_CLASSES } from "./rulesets/group-c-conditions";

/** Most occupations one building can list; a tool call longer than this is dropped. */
export const MAX_PARTS = 6;

/** Share of the building above which the secondary areas make it mixed (art. 11). */
const MIXED_SHARE = 0.1;

export const occupationPartSchema = z.object({
  division: z.string().regex(/^[A-M]-\d{1,2}$/),
  area_m2: z.number().positive(),
  top_height_m: z.number().min(0),
  storeys: z.number().int().min(1),
  separation: z.enum(["isolated", "compartmented", "open"]),
  fire_load_class: z
    .enum(FIRE_LOAD_CLASSES.map((c) => c.id) as [string, ...string[]])
    .optional(),
  role: z.enum(["podium", "tower"]).optional(),
});

/** A tower needs a podium to stand on (art. 11, IV); `classifyMixed` rejects it otherwise. */
const occupationPartsSchema = z
  .array(occupationPartSchema)
  .max(MAX_PARTS)
  .refine(
    (parts) =>
      !parts.some((p) => p.role === "tower") ||
      parts.some((p) => p.role === "podium"),
    { message: "a tower needs a podium" },
  );

/** The occupations of a request or a tool result; anything that does not fit is dropped whole. */
export function pickParts(raw: unknown): OccupationPart[] {
  const parsed = occupationPartsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/**
 * Mixed (art. 11) when the secondary occupations are more than 10% of the
 * building, secondary (art. 12) otherwise. The predominant one is the first.
 * A provisional reading: IN 1 parte 1, art. 4º, which defines the criteria, is
 * not in the repository, and Moura has not confirmed it.
 */
export function mixedKind(parts: OccupationPart[]): MixedKind {
  const total = parts.reduce((sum, p) => sum + p.area_m2, 0);
  const secondary = total - (parts[0]?.area_m2 ?? 0);
  return secondary > total * MIXED_SHARE ? "mixed" : "secondary";
}

/** The user said the property mixes occupations and they are not all subsidiary. */
export function needsParts(answers: Facts): boolean {
  return answers.single_use === false && answers.only_subsidiary === false;
}

export const PARTS_QUESTION =
  "Quais são as ocupações da edificação? Para cada uma: divisão, área (m²), altura do último piso (m), número de pavimentos e se ela é isolada, compartimentada ou aberta em relação às outras. Comece pela predominante.";

/**
 * The classification of the answers, joined per occupation when the property
 * mixes them. Without the list of occupations it waits and asks for it, instead
 * of stopping at a specific analysis.
 */
export function classifyWithParts(
  answers: Facts,
  parts: OccupationPart[],
  analysisDate: string,
  rules: Rule[] = ALL_RULES,
): Classification {
  if (!needsParts(answers)) return classify(answers, analysisDate, rules);
  if (parts.length >= 2) {
    return classifyMixedBuilding(
      { kind: mixedKind(parts), base: answers, parts },
      analysisDate,
      rules,
    );
  }
  return {
    ...classify(answers, analysisDate, rules),
    status: "pending",
    analyses: [],
    next: { ask: PARTS_QUESTION, facts: ["occupation_parts"] },
  };
}
