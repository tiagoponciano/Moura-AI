"use client";

import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { ProjectSearchDialog } from "@/components/shared/project-search-dialog";
import { useProjects } from "@/hooks/use-projects";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** The project the tools work on, under the profile; a click opens the search to change it. */
export function SidebarProject() {
  const projects = useProjects(isSupabaseConfigured());
  const [open, setOpen] = useState(false);

  if (!isSupabaseConfigured()) return null;

  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <button
        type="button"
        disabled={projects.projects.length === 0}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-60"
      >
        <span className="min-w-0">
          <span className="block text-[10px] tracking-wide text-muted-foreground uppercase">
            Projeto atual
          </span>
          <span className="block truncate font-medium">
            {projects.selected?.name ??
              (projects.projects.length
                ? "Escolher projeto"
                : "Nenhum projeto")}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      <ProjectSearchDialog
        open={open}
        projects={projects.projects}
        selectedId={projects.selected?.id}
        onSelect={projects.select}
        onOpenChange={setOpen}
      />
    </div>
  );
}
