"use client";

import { Chat } from "@/components/chat/chat";
import { useClassification } from "../hooks/use-classification";
import { BuildingForm } from "./building-form";
import { ProvisionalNotice } from "./provisional-notice";
import { RequirementsList } from "./requirements-list";

/** Key questions, provisional requirements and the extraction chat. */
export function ClassificationWorkspace() {
  const classification = useClassification();

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto lg:pr-1">
        <ProvisionalNotice />
        <BuildingForm
          building={classification.building}
          onChange={classification.updateAnswer}
          onReset={classification.reset}
        />
        <RequirementsList requirements={classification.requirements} />
      </div>
      <div className="min-h-[420px] lg:min-h-0">
        <Chat
          endpoint="/api/classification/chat"
          onToolResult={classification.handleToolResult}
          history={{ module: "classification" }}
          placeholder="Ex.: loja de 750 m², comercial, 2 pavimentos, 8 m de altura"
          emptyState="Descreva a edificação. A Moura AI registra área, altura, pavimentos e ocupação."
        />
      </div>
    </div>
  );
}
