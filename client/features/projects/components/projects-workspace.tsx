"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProjectsTable } from "./projects-table";

/** The team's projects, searchable, with the way to create one. */
export function ProjectsWorkspace() {
  const enabled = isSupabaseConfigured();
  const projects = useProjects(enabled);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3 md:px-6">
        <PageHeader
          title="Projetos"
          description="Cada projeto reúne os documentos, a classificação, as plantas e a proposta de uma obra."
          actions={
            enabled && (
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus /> Novo projeto
              </Button>
            )
          }
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        {!enabled ? (
          <p className="text-sm text-muted-foreground">
            Os projetos precisam do Supabase configurado.
          </p>
        ) : (
          <>
            {projects.error && (
              <p role="alert" className="text-sm text-destructive">
                {projects.error}
              </p>
            )}
            {projects.projects.length > 0 ? (
              <ProjectsTable projects={projects.projects} />
            ) : !projects.loaded ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <p className="text-sm text-muted-foreground">
                Ainda não há projetos. Crie o primeiro.
              </p>
            )}
          </>
        )}
      </div>
      <NewProjectDialog
        open={createOpen}
        creating={projects.creating}
        error={projects.error}
        onCreate={projects.create}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
