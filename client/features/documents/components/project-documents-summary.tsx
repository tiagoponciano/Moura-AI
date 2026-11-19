"use client";

import { FileText } from "lucide-react";
import { ModuleSummaryCard } from "@/components/shared/module-summary-card";
import { ProjectFileButton } from "@/components/shared/project-file-button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useProjectDocuments } from "../hooks/use-project-documents";

type ProjectDocumentsSummaryProps = { projectId: string };

/** The project's forms on its page, each with the document generated for it, and the proposal. */
export function ProjectDocumentsSummary({
  projectId,
}: ProjectDocumentsSummaryProps) {
  const { forms, proposal, loading, error, download } =
    useProjectDocuments(projectId);

  return (
    <ModuleSummaryCard title="Documentos" icon={FileText} href="/documents">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : forms.length === 0 && !proposal ? (
        <p className="text-sm text-muted-foreground">
          Nenhum formulário começado.
        </p>
      ) : (
        <ul className="flex flex-col divide-y text-sm">
          {forms.map((form) => (
            <li
              key={form.templateId}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{form.name}</p>
                <p className="text-xs text-muted-foreground">
                  Editado em {formatDateTime(form.updatedAt)}
                </p>
              </div>
              {form.document ? (
                <ProjectFileButton file={form.document} onDownload={download} />
              ) : (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Documento não gerado
                </span>
              )}
            </li>
          ))}
          {proposal && (
            <li className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <p className="font-medium">Proposta comercial</p>
                <p className="text-xs text-muted-foreground">
                  Gerada em {formatDateTime(proposal.created_at)}
                </p>
              </div>
              <ProjectFileButton file={proposal} onDownload={download} />
            </li>
          )}
        </ul>
      )}
    </ModuleSummaryCard>
  );
}
