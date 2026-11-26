"use client";

import { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Project } from "@/lib/projects/project";
import { filterProjects, projectDetails } from "@/lib/projects/filter-projects";

type ProjectSearchDialogProps = {
  open: boolean;
  projects: Project[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onOpenChange: (open: boolean) => void;
};

/** Finds a project by name; arrows move, Enter opens. */
export function ProjectSearchDialog({
  open,
  projects,
  selectedId,
  onSelect,
  onOpenChange,
}: ProjectSearchDialogProps) {
  const [query, setQuery] = useState("");

  function handleOpenChange(next: boolean) {
    if (next) setQuery("");
    onOpenChange(next);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Buscar projeto"
      description="Busca pelo nome, cidade, ocupação ou cliente"
      className="sm:max-w-2xl"
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar por nome, cidade ou cliente"
        />
        <CommandList className="max-h-96">
          <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
          {filterProjects(projects, query).map((project) => (
            <CommandItem
              key={project.id}
              value={project.id}
              data-checked={project.id === selectedId}
              className="py-2.5"
              onSelect={() => {
                onSelect(project.id);
                onOpenChange(false);
              }}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{project.name}</span>
                {projectDetails(project) && (
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {projectDetails(project)}
                  </span>
                )}
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
