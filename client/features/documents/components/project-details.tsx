"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fieldChange,
  groupProgress,
  PROJECT_FIELD_GROUPS,
  type ProjectChange,
} from "../lib/project-fields";
import type { Project } from "../lib/projects";

type ProjectDetailsProps = {
  project: Project;
  onChange: (change: ProjectChange) => void;
};

/** The project's shared data, one toggle per group; each field saves on leaving it. */
export function ProjectDetails({ project, onChange }: ProjectDetailsProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground">
        Estes dados entram sozinhos nos formulários deste projeto. Cada campo é
        salvo ao sair dele.
      </p>
      {PROJECT_FIELD_GROUPS.map((group, index) => {
        const { filled, total } = groupProgress(group, project.data);
        return (
          <Collapsible
            key={group.id}
            defaultOpen={index === 0}
            className="group/section rounded-md border"
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium">
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]/section:-rotate-90" />
              <span className="flex-1">{group.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {filled} de {total}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-3 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.fields.map((field) => {
                const id = `${project.id}-${field.key}`;
                return (
                  <div key={field.key} className="flex flex-col gap-1">
                    <Label htmlFor={id} className="text-xs">
                      {field.label}
                    </Label>
                    <Input
                      id={id}
                      defaultValue={project.data[field.key] ?? ""}
                      onBlur={(event) => {
                        const change = fieldChange(
                          field.key,
                          event.target.value,
                          project.data,
                        );
                        if (change) onChange(change);
                      }}
                    />
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
