import { ATTACHMENT_MAX_BYTES } from "@/lib/attachments/rules";

export type FloorPlanFileProblem = "not_pdf" | "empty" | "too_large";

/** `accept` attribute of the floor plan input. */
export const FLOOR_PLAN_ACCEPT = ".pdf,application/pdf";

/** Shown under the drop zone. */
export const FLOOR_PLAN_PROBLEM_MESSAGE: Record<FloorPlanFileProblem, string> =
  {
    not_pdf: "Envie a planta em PDF.",
    empty: "O arquivo está vazio.",
    too_large: "O PDF passa de 20 MB.",
  };

/**
 * Why a file cannot be used as a floor plan, or `undefined` when it can. The
 * size limit is the attachments bucket's, where the conversion will read it.
 */
export function checkFloorPlanFile({
  mimeType,
  sizeBytes,
}: {
  mimeType: string;
  sizeBytes: number;
}): FloorPlanFileProblem | undefined {
  if (mimeType !== "application/pdf") return "not_pdf";
  if (sizeBytes <= 0) return "empty";
  if (sizeBytes > ATTACHMENT_MAX_BYTES) return "too_large";
  return undefined;
}
