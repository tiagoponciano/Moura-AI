"use client";

import { useEffect, useRef, useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import type { ClassificationState } from "../lib/classification-state";
import { useProjects } from "@/hooks/use-projects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useClassification } from "../hooks/use-classification";
import { useProjectClassification } from "../hooks/use-project-classification";
import { ClassificationPanel } from "./classification-panel";
import { ProjectBar } from "./project-bar";

/** Chat that asks the questions, with the answers and the systems they imply beside it. */
export function ClassificationWorkspace() {
  const projects = useProjects(isSupabaseConfigured());
  const persistRef = useRef<(state: ClassificationState) => void>(undefined);
  const {
    answers,
    parts,
    enlargement,
    faults,
    sources,
    classification,
    handleToolResult,
    updateAnswer,
    reset,
    restore,
  } = useClassification((state) => persistRef.current?.(state));
  const { status, persist } = useProjectClassification(
    projects.selected?.id,
    restore,
  );
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);
  const [tab, setTab] = useState<WorkspaceTab>("chat");
  const { answered, total } = classification.progress;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isSupabaseConfigured() && (
        <ProjectBar
          projects={projects.projects}
          selectedId={projects.selected?.id}
          onSelect={projects.select}
          status={status}
        />
      )}
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
            key={projects.selected?.id ?? "none"}
            endpoint="/api/classification/chat"
            body={{
              facts: answers,
              parts,
              enlargement,
              faults,
              projectId: projects.selected?.id,
            }}
            onToolResult={handleToolResult}
            history={{
              module: "classification",
              context: projects.selected
                ? { projectId: projects.selected.id }
                : undefined,
            }}
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
            parts={parts}
            enlargement={enlargement}
            faults={faults}
            sources={sources}
            classification={classification}
            onChange={updateAnswer}
            onReset={reset}
          />
        </div>
      </div>
    </div>
  );
}
