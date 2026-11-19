"use client";

import { Map as MapIcon } from "lucide-react";
import { ModuleSummaryCard } from "@/components/shared/module-summary-card";
import { ProjectFileButton } from "@/components/shared/project-file-button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useProjectPlanRows } from "../hooks/use-project-plan-rows";

type ProjectFloorPlansSummaryProps = { projectId: string };

const MODE_LABEL = { vector: "vetorial", raster: "imagem" } as const;

/** The project's converted plans on its page, with the plan sent and the file produced. */
export function ProjectFloorPlansSummary({
  projectId,
}: ProjectFloorPlansSummaryProps) {
  const { rows, loading, error, download } = useProjectPlanRows(projectId);

  return (
    <ModuleSummaryCard title="Plantas" icon={MapIcon} href="/floor-plans">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma planta convertida.
        </p>
      ) : (
        <ul className="flex flex-col divide-y text-sm">
          {rows.map(({ plan, original, converted }) => (
            <li
              key={plan.id}
              className="flex items-center justify-between gap-3 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{plan.file_name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {plan.format.toUpperCase()} · {MODE_LABEL[plan.mode]}
                  {plan.scale ? ` · 1:${plan.scale}` : ""} ·{" "}
                  {formatDateTime(plan.created_at)}
                </p>
              </div>
              <div className="flex shrink-0">
                {original && (
                  <ProjectFileButton
                    file={original}
                    label="Planta"
                    onDownload={download}
                  />
                )}
                {converted && (
                  <ProjectFileButton
                    file={converted}
                    label={plan.format.toUpperCase()}
                    onDownload={download}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModuleSummaryCard>
  );
}
