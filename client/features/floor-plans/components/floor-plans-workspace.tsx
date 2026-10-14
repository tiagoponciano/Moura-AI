"use client";

import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import { useFloorPlan } from "../hooks/use-floor-plan";
import { FloorPlansPanel } from "./floor-plans-panel";

/** Conversion chat with the floor plan upload, preview and result beside it. */
export function FloorPlansWorkspace() {
  const floorPlan = useFloorPlan();
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
          emptyState="Envie a planta em PDF ao lado. A Moura AI vai identificar escala e camadas e gerar o DWG."
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
          problem={floorPlan.problem}
          onSelect={floorPlan.select}
          onClear={floorPlan.clear}
        />
      </div>
    </div>
  );
}
