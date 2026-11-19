"use client";

import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { NewProjectDialog } from "@/components/shared/new-project-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { filterProjects } from "@/lib/projects/filter-projects";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProjectsTable } from "./projects-table";

/** The team's projects, searchable, with the way to create one. */
export function ProjectsWorkspace() {
  const enabled = isSupabaseConfigured();
  const projects = useProjects(enabled);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const shown = filterProjects(projects.projects, query);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
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
      {!enabled ? (
        <p className="text-sm text-muted-foreground">
          Os projetos precisam do Supabase configurado.
        </p>
      ) : (
        <>
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome"
              aria-label="Buscar projeto"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          {projects.error && (
            <p role="alert" className="text-sm text-destructive">
              {projects.error}
            </p>
          )}
          {shown.length > 0 ? (
            <ProjectsTable projects={shown} />
          ) : !projects.loaded ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {projects.projects.length === 0
                ? "Ainda não há projetos. Crie o primeiro."
                : "Nenhum projeto encontrado."}
            </p>
          )}
        </>
      )}
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
