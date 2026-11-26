"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PROJECT_FIELD_GROUPS,
  groupProgress,
  type ProjectFieldGroup,
} from "@/lib/projects/fields";
import type { Project, ProjectChange } from "@/lib/projects/project";
import { ProjectGroupDialog } from "./project-group-dialog";

type ProjectDataTableProps = {
  project: Project;
  onChange: (change: ProjectChange) => void;
};

/** One row per group of the project's data (property, owner, engineer…); the pencil opens its fields. */
export function ProjectDataTable({ project, onChange }: ProjectDataTableProps) {
  const [editing, setEditing] = useState<ProjectFieldGroup>();

  return (
    <section className="flex flex-col gap-3" aria-label="Dados do projeto">
      <p className="text-xs text-muted-foreground">
        Estes dados entram sozinhos nos formulários e na proposta do projeto.
      </p>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Dados
              </TableHead>
              <TableHead className="h-10 px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Preenchido
              </TableHead>
              <TableHead className="h-10 w-16 px-5">
                <span className="sr-only">Editar</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PROJECT_FIELD_GROUPS.map((group) => {
              const { filled, total } = groupProgress(group, project.data);
              return (
                <TableRow key={group.id}>
                  <TableCell className="px-5 py-3 font-medium">
                    {group.title}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-muted-foreground tabular-nums">
                    {filled} de {total}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${group.title}`}
                      onClick={() => setEditing(group)}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {editing && (
        <ProjectGroupDialog
          key={editing.id}
          project={project}
          group={editing}
          onSave={onChange}
          onClose={() => setEditing(undefined)}
        />
      )}
    </section>
  );
}
