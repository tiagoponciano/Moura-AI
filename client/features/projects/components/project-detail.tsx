"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { writeSelectedProject } from "@/lib/projects/selection";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ProjectDataForm } from "./project-data-form";
import { ProjectFilesList } from "./project-files-list";

type ProjectDetailProps = {
  id: string;
  /** What each module holds for the project, shown once the project is found. */
  children: ReactNode;
};

/** One project: what each module holds for it, then its data. */
export function ProjectDetail({ id, children }: ProjectDetailProps) {
  const projects = useProjects(isSupabaseConfigured());
  const project = projects.projects.find((entry) => entry.id === id);

  // The tools open on the project chosen last, so the one being looked at becomes it.
  useEffect(() => {
    if (project) writeSelectedProject(project.id);
  }, [project]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-6">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Projetos
      </Link>
      {project ? (
        <>
          <PageHeader title={project.name} />
          <div className="grid gap-4 lg:grid-cols-2">{children}</div>
          <ProjectFilesList projectId={project.id} />
          <h2 className="text-sm font-medium">Dados do projeto</h2>
          <ProjectDataForm
            key={project.id}
            project={project}
            onChange={(change) => projects.saveData(project.id, change)}
          />
          {projects.error && (
            <p role="alert" className="text-sm text-destructive">
              {projects.error}
            </p>
          )}
        </>
      ) : projects.loaded ? (
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}
    </div>
  );
}
