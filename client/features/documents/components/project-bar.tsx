"use client";

import { ClipboardList, FileText, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { useProjects } from "@/hooks/use-projects";
import { NewProjectDialog } from "./new-project-dialog";
import { ProjectActions } from "./project-actions";
import { ProjectSearchDialog } from "./project-search-dialog";

/** What the dialog shows under the project bar. */
export type ProjectView = "forms" | "details" | "proposal";

type ProjectBarProps = {
  projects: ReturnType<typeof useProjects>;
  view: ProjectView;
  onView: (view: ProjectView) => void;
  onCreated: () => void;
};

/** Picks the project being worked on, or creates a new one. */
export function ProjectBar({
  projects,
  view,
  onView,
  onCreated,
}: ProjectBarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-60 justify-start"
          disabled={projects.projects.length === 0}
          aria-label="Buscar projeto"
          onClick={() => setSearchOpen(true)}
        >
          <Search />
          <span className="truncate">
            {projects.selected?.name ??
              (projects.projects.length
                ? "Escolha um projeto"
                : "Nenhum projeto")}
          </span>
        </Button>
        {projects.selected && (
          <ProjectActions
            key={projects.selected.id}
            project={projects.selected}
            onRename={(name) => projects.rename(projects.selected!.id, name)}
            onArchive={() => projects.archive(projects.selected!.id)}
          />
        )}
        <Button
          type="button"
          variant={view === "details" ? "secondary" : "outline"}
          disabled={!projects.selected}
          aria-pressed={view === "details"}
          onClick={() => onView(view === "details" ? "forms" : "details")}
        >
          <ClipboardList />
          {view === "details" ? "Ver formulários" : "Dados do projeto"}
        </Button>
        <Button
          type="button"
          variant={view === "proposal" ? "secondary" : "outline"}
          disabled={!projects.selected}
          aria-pressed={view === "proposal"}
          onClick={() => onView(view === "proposal" ? "forms" : "proposal")}
        >
          <FileText />
          {view === "proposal" ? "Ver formulários" : "Proposta"}
        </Button>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Novo projeto
        </Button>
      </div>
      {!createOpen && projects.error && (
        <p role="alert" className="text-xs text-destructive">
          {projects.error}
        </p>
      )}
      <ProjectSearchDialog
        open={searchOpen}
        projects={projects.projects}
        selectedId={projects.selected?.id}
        onSelect={projects.select}
        onOpenChange={setSearchOpen}
      />
      <NewProjectDialog
        open={createOpen}
        creating={projects.creating}
        error={projects.error}
        onCreate={async (name) => {
          const created = await projects.create(name);
          if (created) onCreated();
          return created;
        }}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
