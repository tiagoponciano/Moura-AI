import type { Condition, Rule } from "../engine/types";
import annexJson from "../../norms/in-5/annex-b.json";
import { NORM_VALID_FROM } from "./compile-table";
import { fact } from "./group-c-conditions";
import { SYSTEMS, type SystemId } from "./systems";

type Mark = { id: string; notes: number[] };
type AnnexB = {
  legend: Record<string, string>;
  notes: { number: number; text: string }[];
  rows: {
    divisions: string[];
    vital: Mark[];
    indispensable: Mark[];
    adaptable: Mark[];
  }[];
};
const annex = annexJson as unknown as AnnexB;

/** The fact that says the building is existing or recent (IN 5, art. 4º); anything else is a new building. */
export const BUILDING_CONDITION_FACT = "building_condition";

export type TreatmentClass = "vital" | "indispensable" | "adaptable";

/** The systems each abbreviation of Annex B names. `BI` is not in the printed legend: read as the brigade. */
const SYSTEMS_OF: Record<string, SystemId[]> = {
  SPE: ["extinguishers"],
  IE: ["emergency_lighting"],
  SAL: ["emergency_signage"],
  SE: ["emergency_exits"],
  SA: ["fire_alarm"],
  DAI: ["automatic_detection"],
  PE: ["emergency_plan"],
  AVtr: ["vehicle_access"],
  IEBT: ["low_voltage_installations"],
  Comp: ["horizontal_compartmentation", "vertical_compartmentation"],
  CMAR: ["finishing_materials_control"],
  SPK: ["sprinklers"],
  RES: ["foam", "cooling"],
  SHP: ["hydraulic_preventive"],
  BI: ["fire_brigade"],
};

/** What a footnote of Annex B asks of the cell, when the code can evaluate it. */
const NOTE_CONDITIONS: Record<string, Condition> = {
  // K-2, SHP²: "Somente termoelétrica".
  "K-2:SHP:2": fact("power_plant_type", "eq", "thermal"),
  // M-2, PE³: "Líquidos > 20 m³ ou gases > 10 m³".
  "M-2:PE:3": {
    any: [fact("m2_liquid_m3", "gt", 20), fact("m2_gas_quantity", "gt", 10)],
  },
};

const PRIORITY: Record<TreatmentClass, number> = {
  vital: 1,
  indispensable: 2,
  adaptable: 3,
};

const existing = fact(BUILDING_CONDITION_FACT, "eq", "existing");

const overlay = (
  division: string,
  system: SystemId,
  treatment: TreatmentClass,
  extra: Condition | undefined,
  quote: string,
): Rule => ({
  id: `IN5-B-${division}-${system}-${treatment}`,
  name: `IN 5, ${division}, ${SYSTEMS[system]}: ${treatment}`,
  version: "1",
  validFrom: NORM_VALID_FROM,
  stage: "overlay",
  priority: PRIORITY[treatment],
  when: {
    all: [
      fact("division", "eq", division),
      existing,
      ...(extra ? [extra] : []),
    ],
  },
  then: { overlay: system, class: treatment },
  source: { doc: "IN-5", locator: `Anexo B, ${division}`, quote },
  status: "provisional",
});

/**
 * The first matching label wins (lower priority first), so a vital or
 * indispensable system is never relabelled by the "TE" row, which covers every
 * other system as adaptable. "TODOS" makes every system vital.
 */
export const IN5_RULES: Rule[] = annex.rows.flatMap((row) =>
  row.divisions.flatMap((division) => {
    const rules: Rule[] = [];
    const named = new Set<SystemId>();
    for (const treatment of ["vital", "indispensable"] as const) {
      for (const mark of row[treatment]) {
        if (mark.id === "TODOS") {
          for (const system of Object.keys(SYSTEMS) as SystemId[])
            rules.push(
              overlay(division, system, "vital", undefined, annex.legend.TODOS),
            );
          continue;
        }
        const targets = SYSTEMS_OF[mark.id];
        if (!targets)
          throw new Error(`IN 5 Annex B: unknown abbreviation ${mark.id}`);
        const noted = mark.notes
          .map((n) => NOTE_CONDITIONS[`${division}:${mark.id}:${n}`])
          .filter((c): c is Condition => c !== undefined);
        for (const system of targets) {
          // A conditional cell labels the system only while its condition holds.
          if (noted.length === 0) named.add(system);
          const quote = `${division}: ${mark.id}${mark.notes.map((n) => `(nota ${n})`).join("")}`;
          rules.push(
            overlay(
              division,
              system,
              treatment,
              noted.length ? { all: noted } : undefined,
              quote,
            ),
          );
        }
      }
    }
    if (row.adaptable.some((m) => m.id === "TE")) {
      for (const system of Object.keys(SYSTEMS) as SystemId[])
        if (!named.has(system))
          rules.push(
            overlay(division, system, "adaptable", undefined, annex.legend.TE),
          );
    }
    return rules;
  }),
);
