"use client";

import { ProjectPicker } from "@/components/shared/project-picker";
import type { Project } from "@/lib/projects/project";
import type { ProjectSaveStatus } from "../hooks/use-project-classification";

type ProjectBarProps = {
  projects: Project[];
  selectedId?: string;
  onSelect: (id: string) => void;
  status: ProjectSaveStatus;
};

/** What the status line says about the saved classification of the project. */
function statusText(status: ProjectSaveStatus): string {
  switch (status.kind) {
    case "none":
      return "Sem projeto: nada é salvo.";
    case "loading":
      return "Carregando a classificação…";
    case "saving":
      return "Salvando…";
    case "saved":
      return "Salvo no projeto.";
    case "unavailable":
      return "Não foi possível usar a classificação salva deste projeto. O painel segue sem salvar.";
    case "ready":
      return "Alterações são salvas no projeto.";
  }
}

/** The project the classification belongs to, and whether it is being saved. */
export function ProjectBar({
  projects,
  selectedId,
  onSelect,
  status,
}: ProjectBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
      <ProjectPicker
        projects={projects}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <p
        role={status.kind === "unavailable" ? "alert" : "status"}
        className={
          status.kind === "unavailable"
            ? "text-xs text-destructive"
            : "text-xs text-muted-foreground"
        }
      >
        {statusText(status)}
      </p>
    </div>
  );
}
