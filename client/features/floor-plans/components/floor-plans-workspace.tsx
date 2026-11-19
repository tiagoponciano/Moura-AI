"use client";

import { useRef, useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { ProjectPicker } from "@/components/shared/project-picker";
import { useProjects } from "@/hooks/use-projects";
import { keepProjectFile } from "@/lib/projects/files-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { useFloorPlan } from "../hooks/use-floor-plan";
import { useFloorPlanConversion } from "../hooks/use-floor-plan-conversion";
import { useProjectFloorPlans } from "../hooks/use-project-floor-plans";
import { FloorPlansPanel } from "./floor-plans-panel";
import { ProjectPlans } from "./project-plans";

/** Conversion chat with the floor plan upload, preview and result beside it. */
export function FloorPlansWorkspace() {
  const projects = useProjects(isSupabaseConfigured());
  const projectId = projects.selected?.id;
  const projectPlans = useProjectFloorPlans(projectId);
  const floorPlan = useFloorPlan();
  /** Plans already kept in this session, so converting to DXF and then DWG keeps the plan once. */
  const keptPlans = useRef(new Set<string>());
  const [keepFailed, setKeepFailed] = useState(false);
  const conversion = useFloorPlanConversion(
    floorPlan.plan,
    (outcome, fileName, converted) => {
      void projectPlans.record({
        fileName,
        mode: outcome.mode,
        scale: outcome.scale,
        format: outcome.format,
      });
      if (!projectId) return;
      void (async () => {
        const kept = [
          await keepProjectFile(projectId, converted.blob, {
            kind: "conversion",
            fileName: converted.fileName,
          }),
        ];
        const original = floorPlan.plan?.file;
        const key = `${projectId}/${fileName}`;
        if (original && !keptPlans.current.has(key)) {
          keptPlans.current.add(key);
          kept.push(
            await keepProjectFile(projectId, original, {
              kind: "plan",
              fileName,
            }),
          );
        }
        setKeepFailed(kept.includes(false));
      })();
    },
  );
  const [tab, setTab] = useState<WorkspaceTab>("chat");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isSupabaseConfigured() && (
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
          <ProjectPicker
            projects={projects.projects}
            selectedId={projectId}
            onSelect={projects.select}
          />
          <p className="text-xs text-muted-foreground">
            {keepFailed
              ? "Baixado, mas não foi possível guardar os arquivos no projeto."
              : projectId
                ? "As conversões e os arquivos ficam guardados no projeto."
                : "Sem projeto: nada é guardado."}
          </p>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <WorkspaceTabs
          value={tab}
          onChange={setTab}
          panelLabel={floorPlan.plan ? "Planta 1/1" : "Planta 0/1"}
          className="lg:hidden"
        />
        <div
          className={cn("min-h-0 flex-1", tab !== "chat" && "hidden lg:block")}
        >
          <Chat
            endpoint="/api/floor-plans/chat"
            placeholder="Ex.: planta baixa do térreo, escala 1:100"
            emptyState="Envie a planta ao lado (PDF, JPEG ou PNG), informe a escala ou peça para ler, e baixe o DXF ou o DWG."
            className="rounded-none border-0 bg-transparent"
          />
        </div>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            tab !== "panel" && "hidden lg:flex",
          )}
        >
          <FloorPlansPanel
            plan={floorPlan.plan}
            conversion={conversion}
            problem={floorPlan.problem}
            onSelect={(file) => {
              conversion.reset();
              floorPlan.select(file);
            }}
            onClear={() => {
              conversion.reset();
              floorPlan.clear();
            }}
            projectSection={
              <ProjectPlans
                hasProject={projectId !== undefined}
                plans={projectPlans.plans}
                loading={projectPlans.loading}
                error={projectPlans.error}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
