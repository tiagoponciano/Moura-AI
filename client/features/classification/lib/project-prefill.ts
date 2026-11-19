import type { Facts } from "./engine/types";

/**
 * What the classification already asked, as the project data keys that follow the
 * request form of IN 1 parte 1, Annex B. The keys are the documents feature's
 * `block_*`, `building_*` and `property_*` fields, written here as plain strings
 * because a feature does not import another.
 */
const NUMBER_FACTS: [fact: string, key: string][] = [
  ["area_m2", "block_area"],
  ["storeys", "block_floors"],
  ["height_m", "block_height"],
  ["capacity_people", "block_capacity"],
];

/** Annex B offers three fire load classes; IN 3 has five, so the ends share a label. */
const FIRE_LOAD_LABEL: Record<string, string> = {
  negligible: "Baixa",
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  very_high: "Alta",
};

/**
 * The project keys the answers can fill. A key the project already has is left
 * alone: what a person typed is never replaced by a later answer.
 */
export function projectDataFromFacts(
  facts: Facts,
  current: Record<string, string>,
): Record<string, string> {
  const wanted: Record<string, string> = {};
  for (const [fact, key] of NUMBER_FACTS) {
    const value = facts[fact];
    if (typeof value === "number") wanted[key] = String(value);
  }
  if (typeof facts.division === "string") {
    wanted.property_occupancy = facts.division;
  }
  const load = FIRE_LOAD_LABEL[String(facts.fire_load_class)];
  if (load) wanted.building_fire_load = load;

  const change: Record<string, string> = {};
  for (const [key, value] of Object.entries(wanted)) {
    if (!current[key]) change[key] = value;
  }
  return change;
}
