"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { TemplateEntry } from "../lib/templates";
import { CbmscFormsBrowser } from "./cbmsc-forms-browser";
import { ProjectBar } from "./project-bar";

type FormsHomeProps = {
  templates: TemplateEntry[];
  projects: ReturnType<typeof useProjects>;
  onFill: (templateId: string) => void;
};

/** The page with no form open: the forms dialog, already open on arrival. */
export function FormsHome({ templates, projects, onFill }: FormsHomeProps) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Anexos do CBMSC em breve
      </p>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Dialog defaultOpen>
        <DialogTrigger asChild>
          <Button>
            <FileText /> Abrir formulários
          </Button>
        </DialogTrigger>
        <DialogContent className="flex h-[85vh] flex-col sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Anexos do CBMSC</DialogTitle>
            <DialogDescription>
              Formulários das Instruções Normativas em vigor, na versão
              publicada pelo CBMSC.
            </DialogDescription>
          </DialogHeader>
          <ProjectBar projects={projects} />
          <CbmscFormsBrowser templates={templates} onFill={onFill} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
