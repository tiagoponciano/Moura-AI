"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { useProjects } from "../hooks/use-projects";
import type { Filling } from "../lib/fillings";
import { startedForms } from "../lib/started-forms";
import type { TemplateEntry } from "../lib/templates";
import { CbmscFormsBrowser } from "./cbmsc-forms-browser";
import { PpciChecklist } from "./ppci-checklist";
import { ProjectBar, type ProjectView } from "./project-bar";
import { ProjectDetails } from "./project-details";
import { StartedForms } from "./started-forms";

type FormsHomeProps = {
  templates: TemplateEntry[];
  fillings: Filling[];
  projects: ReturnType<typeof useProjects>;
  onFill: (templateId: string) => void;
};

/** The page with no form open: the forms dialog, already open on arrival. */
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
    <div className="flex flex-1 items-center justify-center p-4">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <button
            type="button"
            className="group flex w-44 flex-col gap-2.5 text-left focus-visible:outline-none"
          >
            <span className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-2 rounded-md border bg-card px-4 text-center text-xs text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md group-focus-visible:border-primary group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
              <Landmark className="size-6 text-primary" />
              Formulários oficiais, sempre atualizados
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Anexos do CBMSC</span>
              <span className="w-fit rounded border px-1.5 font-mono text-[11px] text-muted-foreground">
                Google Docs
              </span>
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="flex h-[85vh] flex-col sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Anexos do CBMSC</DialogTitle>
            <DialogDescription>
              Formulários das Instruções Normativas em vigor, na versão
              publicada pelo CBMSC.
            </DialogDescription>
          </DialogHeader>
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
          ) : project && shown === "checklist" ? (
            <PpciChecklist key={project.id} projectId={project.id} />
          ) : (
            <>
              {project && (
                <StartedForms
                  forms={startedForms(fillings, templates)}
                  onOpen={onFill}
                />
              )}
              <CbmscFormsBrowser templates={templates} onFill={onFill} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
