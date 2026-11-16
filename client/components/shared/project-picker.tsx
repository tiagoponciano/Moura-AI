"use client";

import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/projects/project";
import { ProjectSearchDialog } from "./project-search-dialog";

type ProjectPickerProps = {
  projects: Project[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

/** The project a tab works on: a button with its name that opens the search. */
export function ProjectPicker({
  projects,
  selectedId,
  onSelect,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = projects.find((project) => project.id === selectedId);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={projects.length === 0}
        aria-label="Escolher projeto"
        onClick={() => setOpen(true)}
      >
        <FolderOpen />
        <span className="max-w-48 truncate">
          {selected?.name ??
            (projects.length ? "Escolher projeto" : "Nenhum projeto")}
        </span>
      </Button>
      <ProjectSearchDialog
        open={open}
        projects={projects}
        selectedId={selectedId}
        onSelect={onSelect}
        onOpenChange={setOpen}
      />
    </>
  );
}
