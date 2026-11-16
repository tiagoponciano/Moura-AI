import { z } from "zod";
import { FAULT_IDS, faultsById, pickFaults } from "../lib/annex-d";

/** Input of the `record_faults` tool: the rows of Annex D that match the construction errors. */
export const recordFaultsInput = z.object({
  faults: z
    .array(z.enum(FAULT_IDS))
    .describe(
      "Ids of the rows that match the construction errors the user described, chosen from the list in the instructions. It replaces the list recorded before, so always send all of them. Send an empty list when the user says there are no errors.",
    ),
});

/**
 * What the tool returns. The client reads `faults`; the model reads `note`; the
 * chat's status line reads `summary`.
 */
export function recordFaults(input: unknown) {
  const faults = pickFaults((input as { faults?: unknown } | null)?.faults);
  const rows = faultsById(faults);
  return {
    faults,
    note: rows.some((f) => f.refused)
      ? "At least one error is not admitted by the norm. Tell the user to check the panel."
      : "Recorded. Do not explain the measures; the panel shows them.",
    summary: faults.length
      ? `Erros de execução registrados: ${faults.join(", ")}`
      : "Nenhum erro de execução registrado",
  };
}
