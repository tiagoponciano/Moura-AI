"use client";

import { Layers } from "lucide-react";
import { ModuleSummaryCard } from "@/components/shared/module-summary-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useClassificationSummary } from "../hooks/use-classification-summary";

type ProjectClassificationSummaryProps = { projectId: string };

/** The project's classification on its page: risk, what is missing and the required systems. */
export function ProjectClassificationSummary({
  projectId,
}: ProjectClassificationSummaryProps) {
  const { summary, updatedAt, error, loading } =
    useClassificationSummary(projectId);

  return (
    <ModuleSummaryCard
      title="Classificação"
      icon={Layers}
      href="/classification"
    >
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : !summary || summary.status === "empty" ? (
        <p className="text-sm text-muted-foreground">Ainda não classificado.</p>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          {summary.status === "analysis" ? (
            <p>
              As regras pedem uma análise específica; veja na classificação.
            </p>
          ) : summary.risk?.status === "decided" ? (
            <div>
              <p className="font-medium text-primary">
                Risco {summary.risk.level}
              </p>
              <p>{summary.risk.process}</p>
              <p className="text-xs text-muted-foreground">
                {summary.risk.reason.locator}
              </p>
            </div>
          ) : summary.risk?.status === "pending" ? (
            <p>O risco depende das respostas que faltam.</p>
          ) : null}
          <p className="text-muted-foreground">
            {summary.progress.answered} de {summary.progress.total} respostas
            {summary.missing.length > 0 &&
              ` · Falta: ${summary.missing.join(", ")}`}
          </p>
          {summary.required.length > 0 && (
            <p>
              <span className="text-muted-foreground">
                Sistemas exigidos ({summary.required.length}):{" "}
              </span>
              {summary.required.join(", ")}
            </p>
          )}
          {updatedAt && (
            <p className="text-xs text-muted-foreground">
              Atualizada em {formatDateTime(updatedAt)}
            </p>
          )}
        </div>
      )}
    </ModuleSummaryCard>
  );
}
