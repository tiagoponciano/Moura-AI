import { z } from "zod";
import annexJson from "../norms/in-5/annex-d.json";

export type ConstructionFault = {
  /** Stable id by the printed order: D1, D2, … */
  id: string;
  system: string;
  sigla: string;
  fault: string;
  parameter: string;
  measures: string;
  /** The norm does not admit the error: no compensation exists. */
  refused: boolean;
};

/** The rows of Annex D of IN 5, as printed. */
export const CONSTRUCTION_FAULTS: ConstructionFault[] = annexJson.rows.map(
  (row, index) => ({
    id: `D${index + 1}`,
    system: row.system,
    sigla: row.sigla,
    fault: row.fault,
    parameter: row.parameter,
    measures: row.measures,
    refused: row.measures.startsWith("Não admitido"),
  }),
);

export const FAULT_IDS = CONSTRUCTION_FAULTS.map((f) => f.id) as [
  string,
  ...string[],
];

/** The notes printed under the table. */
export const ANNEX_D_NOTES: string[] = annexJson.notes.map((n) => n.text);

/** One line per row, for the model to choose from: id, system, fault and parameter. */
export function faultChoices(): string {
  return CONSTRUCTION_FAULTS.map(
    (f) =>
      `- ${f.id}: ${f.system}, ${f.fault}, ${f.parameter === "não aplicável" || f.parameter === "Não aplicável" ? "no parameter" : f.parameter}`,
  ).join("\n");
}

/** The faults of a request or a tool result: known ids once each; anything else drops the list. */
export function pickFaults(raw: unknown): string[] {
  const parsed = z
    .array(z.enum(FAULT_IDS))
    .max(FAULT_IDS.length)
    .safeParse(raw);
  return parsed.success ? [...new Set(parsed.data)] : [];
}

/** The rows for the ids, in the printed order. */
export function faultsById(ids: string[]): ConstructionFault[] {
  return CONSTRUCTION_FAULTS.filter((f) => ids.includes(f.id));
}
