"use client";

import { Check } from "lucide-react";
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
import { filterProjects } from "../lib/filter-projects";

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
      description="Busca pelo nome"
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar projeto"
        />
        <CommandList>
          <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
          {filterProjects(projects, query).map((project) => (
            <CommandItem
              key={project.id}
              value={project.id}
              onSelect={() => {
                onSelect(project.id);
                onOpenChange(false);
              }}
            >
              {project.name}
              {project.id === selectedId && (
                <Check className="ml-auto" aria-label="Projeto atual" />
              )}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
