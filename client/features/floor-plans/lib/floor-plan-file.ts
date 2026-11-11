import { ATTACHMENT_MAX_BYTES } from "@/lib/attachments/rules";

export type FloorPlanFileProblem = "unsupported" | "empty" | "too_large";

const FLOOR_PLAN_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** `accept` attribute of the floor plan input. */
export const FLOOR_PLAN_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

/** Shown under the drop zone. */
export const FLOOR_PLAN_PROBLEM_MESSAGE: Record<FloorPlanFileProblem, string> =
  {
    unsupported: "Envie a planta em PDF, JPEG ou PNG.",
    empty: "O arquivo está vazio.",
    too_large: "O arquivo passa de 20 MB.",
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
  if (!FLOOR_PLAN_TYPES.includes(mimeType)) return "unsupported";
  if (sizeBytes <= 0) return "empty";
  if (sizeBytes > ATTACHMENT_MAX_BYTES) return "too_large";
  return undefined;
}
