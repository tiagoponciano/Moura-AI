"use client";

import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import { useFloorPlan } from "../hooks/use-floor-plan";
import { useFloorPlanConversion } from "../hooks/use-floor-plan-conversion";
import { FloorPlansPanel } from "./floor-plans-panel";

/** Conversion chat with the floor plan upload, preview and result beside it. */
export function FloorPlansWorkspace() {
  const floorPlan = useFloorPlan();
  const conversion = useFloorPlanConversion(floorPlan.plan);
  const [tab, setTab] = useState<WorkspaceTab>("chat");

  return (
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
        />
      </div>
    </div>
  );
}
