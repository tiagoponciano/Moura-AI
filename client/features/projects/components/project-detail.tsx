"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ProjectActions } from "@/components/shared/project-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from "@/hooks/use-projects";
import { writeSelectedProject } from "@/lib/projects/selection";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { describeProject } from "../lib/project-summary";
import { ProjectDataTable } from "@/components/shared/project-data-table";
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
  const router = useRouter();
  const [tab, setTab] = useState("summary");

  // The tools open on the project chosen last, so the one being looked at becomes it.
  useEffect(() => {
    if (project) writeSelectedProject(project.id);
  }, [project]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3 md:px-6">
        <Link
          href="/projects"
          className="mb-1 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Projetos
        </Link>
        {project && (
          <PageHeader
            title={project.name}
            description={describeProject(project)}
            actions={
              <ProjectActions
                project={project}
                onRename={(name) => projects.rename(project.id, name)}
                onArchive={async () => {
                  const archived = await projects.archive(project.id);
                  if (archived) router.push("/projects");
                  return archived;
                }}
              />
            }
          />
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        {project ? (
          <>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList
                variant="line"
                className="w-full justify-start border-b"
              >
                <TabsTrigger value="summary" className="flex-none px-3">
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="data" className="flex-none px-3">
                  Dados do projeto
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="flex flex-col gap-5 pt-4">
                <div className="grid gap-4 lg:grid-cols-2">{children}</div>
                <ProjectFilesList projectId={project.id} />
              </TabsContent>
              <TabsContent value="data" className="pt-4">
                <ProjectDataTable
                  key={project.id}
                  project={project}
                  onChange={(change) => projects.saveData(project.id, change)}
                />
              </TabsContent>
            </Tabs>
            {projects.error && (
              <p role="alert" className="text-sm text-destructive">
                {projects.error}
              </p>
            )}
          </>
        ) : projects.loaded ? (
          <p className="text-sm text-muted-foreground">
            Projeto não encontrado.
          </p>
        ) : (
          <Skeleton className="h-40 w-full" />
        )}
      </div>
    </div>
  );
}
