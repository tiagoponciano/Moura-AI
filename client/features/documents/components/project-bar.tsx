"use client";

import { ClipboardList, FileStack, FileText, Plus, Search } from "lucide-react";
import { useState } from "react";
import { ProjectActions } from "@/components/shared/project-actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { useProjects } from "@/hooks/use-projects";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { ProjectSearchDialog } from "@/components/shared/project-search-dialog";

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
    <div className="flex flex-col gap-3">
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
        <div className="flex-1" />
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Novo projeto
        </Button>
      </div>
      <Tabs value={view} onValueChange={(next) => onView(next as ProjectView)}>
        <TabsList>
          <TabsTrigger value="forms">
            <FileStack />
            Formulários
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!projects.selected}>
            <ClipboardList />
            Dados do projeto
          </TabsTrigger>
          <TabsTrigger value="proposal" disabled={!projects.selected}>
            <FileText />
            Proposta
          </TabsTrigger>
        </TabsList>
      </Tabs>
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
