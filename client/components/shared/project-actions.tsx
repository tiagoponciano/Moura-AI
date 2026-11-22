"use client";

import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { type Project } from "@/lib/projects/project";

type ProjectActionsProps = {
  project: Project;
  onRename: (name: string) => Promise<boolean>;
  onArchive: () => Promise<boolean>;
};

type Dialogs = "rename" | "archive" | undefined;

/** A menu with rename and archive for the current project, each behind a dialog. */
export function ProjectActions({
  project,
  onRename,
  onArchive,
}: ProjectActionsProps) {
  const [open, setOpen] = useState<Dialogs>();
  const [name, setName] = useState(project.name);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    if (await action()) setOpen(undefined);
    setBusy(false);
  }

  function handleRename(event: FormEvent) {
    event.preventDefault();
    void run(() => onRename(name));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Mais ações do projeto"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => {
              setName(project.name);
              setOpen("rename");
            }}
          >
            <Pencil />
            Renomear
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setOpen("archive")}
          >
            <Archive />
            Arquivar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={open === "rename"}
        onOpenChange={(next) => !next && setOpen(undefined)}
      >
        <DialogContent>
          <form onSubmit={handleRename} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Renomear projeto</DialogTitle>
              <DialogDescription>
                O novo nome aparece para toda a equipe.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Novo nome do projeto"
            />
            <DialogFooter>
              <Button type="submit" disabled={!name.trim() || busy}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={open === "archive"}
        onOpenChange={(next) => !next && setOpen(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Arquivar “{project.name}”?</DialogTitle>
            <DialogDescription>
              O projeto some da lista para toda a equipe. Nada é apagado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(undefined)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void run(onArchive)}
            >
              Arquivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
