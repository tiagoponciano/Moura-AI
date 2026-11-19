"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import { PROJECT_FIELD_GROUPS } from "@/lib/projects/fields";
import { writeSelectedProject } from "@/lib/projects/selection";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
          <h2 className="text-sm font-medium">Dados do projeto</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PROJECT_FIELD_GROUPS.map((group) => (
              <section key={group.id} className="rounded-lg border p-4">
                <h2 className="mb-3 text-sm font-medium">{group.title}</h2>
                <dl className="flex flex-col gap-1.5 text-sm">
                  {group.fields
                    .filter((field) => project.data[field.key])
                    .map((field) => (
                      <div key={field.key} className="flex flex-col">
                        <dt className="text-xs text-muted-foreground">
                          {field.label}
                        </dt>
                        <dd className="break-words">
                          {project.data[field.key]}
                        </dd>
                      </div>
                    ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      ) : projects.loaded ? (
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}
    </div>
  );
}
