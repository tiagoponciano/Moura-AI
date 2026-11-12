"use client";

import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import { useClassification } from "../hooks/use-classification";
import { ClassificationPanel } from "./classification-panel";

/** Chat that asks the questions, with the answers and the systems they imply beside it. */
export function ClassificationWorkspace() {
  const {
    answers,
    sources,
    classification,
    handleToolResult,
    updateAnswer,
    reset,
  } = useClassification();
  const [tab, setTab] = useState<WorkspaceTab>("chat");
  const { answered, total } = classification.progress;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
      <WorkspaceTabs
        value={tab}
        onChange={setTab}
        panelLabel={`Classificação ${answered}/${total}`}
        className="lg:hidden"
      />
      <div
        className={cn("min-h-0 flex-1", tab !== "chat" && "hidden lg:block")}
      >
        <Chat
          endpoint="/api/classification/chat"
          body={{ facts: answers }}
          onToolResult={handleToolResult}
          history={{ module: "classification" }}
          placeholder="Ex.: loja de roupas com 1.800 m², 2 pavimentos e 9 m de altura"
          emptyState="Descreva o imóvel comercial. A Moura AI faz as perguntas que faltam e mostra ao lado os sistemas exigidos, com a fonte na norma."
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
          answers={answers}
          sources={sources}
          classification={classification}
          onChange={updateAnswer}
          onReset={reset}
        />
      </div>
    </div>
  );
}
