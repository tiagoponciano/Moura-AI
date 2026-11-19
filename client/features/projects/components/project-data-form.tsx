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
  PROJECT_FIELD_GROUPS,
  fieldChange,
  groupProgress,
} from "@/lib/projects/fields";
import type { Project, ProjectChange } from "@/lib/projects/project";

type ProjectDataFormProps = {
  project: Project;
  onChange: (change: ProjectChange) => void;
};

/** The project's data, one section per group: the property, its owner, the engineer and the block. Each field saves on leaving it. */
export function ProjectDataForm({ project, onChange }: ProjectDataFormProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Estes dados entram sozinhos nos formulários do projeto. Cada campo é
        salvo ao sair dele.
      </p>
      {PROJECT_FIELD_GROUPS.map((group, index) => {
        const { filled, total } = groupProgress(group, project.data);
        return (
          <Collapsible
            key={group.id}
            defaultOpen={index === 0}
            className="group/section rounded-lg border"
          >
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium">
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]/section:-rotate-90" />
              <span className="flex-1">{group.title}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {filled} de {total}
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
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
