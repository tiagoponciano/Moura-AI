"use client";

import { saveAs } from "file-saver";
import { toast } from "sonner";
import { nameWithProject } from "@/lib/projects/file-name";
import { keepProjectFile } from "@/lib/projects/files-client";
import type { Project } from "@/lib/projects/project";
import { buildReportDocx, reportLines } from "../lib/classification-report";
import type { Classification } from "../lib/classify";

/** Downloads the report of the classification and keeps that same file in the chosen project. */
export function useClassificationReport(
  classification: Classification,
  project: Project | undefined,
) {
  return async function downloadReport() {
    const fileName = nameWithProject("Classificação.docx", project?.name);
    const blob = buildReportDocx(reportLines(classification, project?.name));
    saveAs(blob, fileName);
    if (!project) return toast.success("Relatório baixado.");
    const kept = await keepProjectFile(project.id, blob, {
      kind: "classification",
      fileName,
    });
    if (kept) toast.success("Relatório baixado e guardado no projeto.");
    else
      toast.warning(
        "O relatório foi baixado, mas não foi guardado no projeto.",
      );
  };
}
