"use client";

import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { useProjects } from "@/hooks/use-projects";
import type { Filling } from "../lib/fillings";
import type { TemplateEntry } from "../lib/templates";
import { FormsList } from "./forms-list";
import { ProjectBar, type ProjectView } from "./project-bar";
import { ProjectDetails } from "./project-details";
import { ProposalForm } from "./proposal-form";

type FormsHomeProps = {
  templates: TemplateEntry[];
  fillings: Filling[];
  projects: ReturnType<typeof useProjects>;
  onFill: (templateId: string) => void;
};

/** The page with no form open: the project bar, then its forms, data or proposal. */
export function FormsHome({
  templates,
  fillings,
  projects,
  onFill,
}: FormsHomeProps) {
  const [view, setView] = useState<ProjectView>("forms");
  const project = projects.selected;
  const shown = project ? view : "forms";

  if (!isSupabaseConfigured()) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Anexos do CBMSC em breve
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <ProjectBar
        projects={projects}
        view={shown}
        onView={setView}
        onCreated={() => setView("details")}
      />
      {project && shown === "details" ? (
        <ProjectDetails
          key={project.id}
          project={project}
          onChange={(change) => projects.saveData(project.id, change)}
        />
      ) : project && shown === "proposal" ? (
        <ProposalForm key={project.id} project={project} />
      ) : (
        <FormsList templates={templates} fillings={fillings} onFill={onFill} />
      )}
    </div>
  );
}
