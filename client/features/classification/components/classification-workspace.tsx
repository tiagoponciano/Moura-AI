"use client";

import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import { useClassification } from "../hooks/use-classification";
import { QUESTION_COUNT } from "../lib/building";
import { ClassificationPanel } from "./classification-panel";

/** Extraction chat with the key questions and provisional requirements beside it. */
export function ClassificationWorkspace() {
  const classification = useClassification();
  const [tab, setTab] = useState<WorkspaceTab>("chat");

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
      <WorkspaceTabs
        value={tab}
        onChange={setTab}
        panelLabel={`Classificação ${classification.answered}/${QUESTION_COUNT}`}
        className="lg:hidden"
      />
      <div
        className={cn("min-h-0 flex-1", tab !== "chat" && "hidden lg:block")}
      >
        <Chat
          endpoint="/api/classification/chat"
          onToolResult={classification.handleToolResult}
          history={{ module: "classification" }}
          placeholder="Ex.: loja de 750 m², comercial, 2 pavimentos, 8 m de altura"
          emptyState="Descreva a edificação. A Moura AI registra área, altura, pavimentos e ocupação ao lado."
          className="rounded-none border-0 bg-transparent"
        />
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          tab !== "panel" && "hidden lg:flex",
        )}
      >
        <ClassificationPanel
          building={classification.building}
          sources={classification.sources}
          answered={classification.answered}
          groups={classification.groups}
          onChange={classification.updateAnswer}
          onReset={classification.reset}
        />
      </div>
    </div>
  );
}
