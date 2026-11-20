import { saveAs } from "file-saver";
import { keepProjectFile } from "@/lib/projects/files-client";

export const NOT_KEPT_MESSAGE =
  "O PDF foi baixado, mas não foi guardado no projeto.";

/**
 * Downloads the PDF the person just previewed and keeps that same file in the
 * project, not a new one. Throws when the file cannot be read; a failure to keep
 * it does not undo the download and comes back as a warning.
 */
export async function approvePdf(
  pdf: { url: string; fileName: string },
  projectId: string | undefined,
): Promise<{ warning?: string }> {
  const response = await fetch(pdf.url);
  if (!response.ok) throw new Error("Não foi possível ler a prévia.");
  const blob = await response.blob();
  saveAs(blob, pdf.fileName);
  if (!projectId) return {};
  const kept = await keepProjectFile(projectId, blob, {
    kind: "form",
    fileName: pdf.fileName,
  });
  return kept ? {} : { warning: NOT_KEPT_MESSAGE };
}
