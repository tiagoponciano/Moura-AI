import { listNormSources } from "./norm-sources";
import type { SystemId } from "./rulesets/systems";

/** The instruction that sizes each system. Systems with no instruction of their own are left out. */
const SYSTEM_DOC: Partial<Record<SystemId, string>> = {
  extinguishers: "IN-6",
  hydraulic_preventive: "IN-7",
  combustible_gas: "IN-8",
  emergency_exits: "IN-9",
  smoke_control: "IN-10",
  emergency_lighting: "IN-11",
  fire_alarm: "IN-12",
  automatic_detection: "IN-12",
  emergency_signage: "IN-13",
  structural_protection: "IN-14",
  horizontal_compartmentation: "IN-14",
  vertical_compartmentation: "IN-14",
  building_isolation: "IN-14",
  sprinklers: "IN-15",
  finishing_materials_control: "IN-18",
  low_voltage_installations: "IN-19",
  urban_hydrants: "IN-25",
  fire_brigade: "IN-28",
  emergency_plan: "IN-31",
  vehicle_access: "IN-35",
};

export type SystemNorm = { doc: string; label: string; url: string };

/** The instruction behind a system, with the Drive link it was extracted from; `undefined` when it has none. */
export function systemNorm(systemId: string): SystemNorm | undefined {
  const doc = SYSTEM_DOC[systemId as SystemId];
  const source = doc && listNormSources().find((s) => s.doc === doc);
  if (!doc || !source) return undefined;
  return { doc, label: doc.replace("IN-", "IN "), url: source.sourceUrl };
}

/** Every system id that has an instruction, for checking the table against the catalog. */
export const SYSTEMS_WITH_NORM = Object.keys(SYSTEM_DOC);
