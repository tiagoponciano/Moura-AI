"use client";

import { ClipboardList, FileText, Loader2, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useProjects } from "@/hooks/use-projects";
import { ProjectActions } from "./project-actions";

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
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (await projects.create(name)) {
      setName("");
      onCreated();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={projects.selected?.id ?? ""}
          onValueChange={projects.select}
          disabled={projects.projects.length === 0}
        >
          <SelectTrigger aria-label="Projeto" className="w-60">
            <SelectValue
              placeholder={
                projects.projects.length
                  ? "Escolha um projeto"
                  : "Nenhum projeto"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {projects.projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <form
          onSubmit={handleSubmit}
          className="flex min-w-60 flex-1 items-center gap-2"
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Novo projeto"
            aria-label="Nome do novo projeto"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!name.trim() || projects.creating}
          >
            {projects.creating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus />
            )}
            Criar projeto
          </Button>
        </form>
      </div>
      {projects.error && (
        <p role="alert" className="text-xs text-destructive">
          {projects.error}
        </p>
      )}
    </div>
  );
}
