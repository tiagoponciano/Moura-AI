"use client";

import { Check, Search } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/projects/project";
import { cn } from "@/lib/utils";
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
  const [active, setActive] = useState(0);
  const found = filterProjects(projects, query);

  function choose(project: Project) {
    onSelect(project.id);
    onOpenChange(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((active + step + found.length) % Math.max(found.length, 1));
    } else if (event.key === "Enter" && found[active]) {
      event.preventDefault();
      choose(found[active]);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setQuery("");
        setActive(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="gap-0 p-0" onKeyDown={handleKeyDown}>
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar projeto</DialogTitle>
          <DialogDescription>
            Digite parte do nome do projeto.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="size-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Buscar projeto"
            aria-label="Buscar projeto"
            autoComplete="off"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <ul role="listbox" className="max-h-72 overflow-y-auto p-2">
          {found.map((project, index) => (
            <li
              key={project.id}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(project)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm",
                index === active && "bg-accent text-accent-foreground",
              )}
            >
              {project.name}
              {project.id === selectedId && (
                <Check className="size-4" aria-label="Projeto atual" />
              )}
            </li>
          ))}
          {found.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum projeto encontrado.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
