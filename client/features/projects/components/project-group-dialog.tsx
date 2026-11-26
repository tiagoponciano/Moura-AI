"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectFieldGroup } from "@/lib/projects/fields";
import type { Project, ProjectChange } from "@/lib/projects/project";
import { groupChange, groupDraft } from "../lib/project-data-edit";

type ProjectGroupDialogProps = {
  project: Project;
  group: ProjectFieldGroup;
  onSave: (change: ProjectChange) => void;
  onClose: () => void;
};

/** The fields of one group in a dialog; nothing is saved until "Salvar". */
export function ProjectGroupDialog({
  project,
  group,
  onSave,
  onClose,
}: ProjectGroupDialogProps) {
  const [draft, setDraft] = useState(() => groupDraft(group, project.data));
  const change = groupChange(group, draft, project.data);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85vh] flex-col sm:max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>{group.title}</DialogTitle>
        </DialogHeader>
        <form
          id="project-group-form"
          className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-1 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (change) onSave(change);
            onClose();
          }}
        >
          {group.fields.map((field) => {
            const id = `${project.id}-${field.key}`;
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <Label htmlFor={id} className="text-xs">
                  {field.label}
                </Label>
                <Input
                  id={id}
                  value={draft[field.key] ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                />
              </div>
            );
          })}
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="project-group-form" disabled={!change}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
