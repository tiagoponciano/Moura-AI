"use client";

import { ClipboardList, Loader2, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useProjects } from "../hooks/use-projects";

type ProjectBarProps = {
  projects: ReturnType<typeof useProjects>;
  showingDetails: boolean;
  onToggleDetails: () => void;
  onCreated: () => void;
};

/** Picks the project being worked on, or creates a new one. */
export function ProjectBar({
  projects,
  showingDetails,
  onToggleDetails,
  onCreated,
}: ProjectBarProps) {
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (await projects.create(name)) {
      setName("");
      onCreated();
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={projects.selected?.id ?? ""}
          onValueChange={projects.select}
          disabled={projects.projects.length === 0}
        >
          <SelectTrigger aria-label="Projeto" className="w-60">
            <SelectValue
              placeholder={
                projects.projects.length
                  ? "Escolha um projeto"
                  : "Nenhum projeto"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {projects.projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant={showingDetails ? "secondary" : "outline"}
          disabled={!projects.selected}
          aria-pressed={showingDetails}
          onClick={onToggleDetails}
        >
          <ClipboardList />
          {showingDetails ? "Ver formulários" : "Dados do projeto"}
        </Button>
        <form
          onSubmit={handleSubmit}
          className="flex min-w-60 flex-1 items-center gap-2"
        >
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Novo projeto"
            aria-label="Nome do novo projeto"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!name.trim() || projects.creating}
          >
            {projects.creating ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus />
            )}
            Criar projeto
          </Button>
        </form>
      </div>
      {projects.error && (
        <p role="alert" className="text-xs text-destructive">
          {projects.error}
        </p>
      )}
    </div>
  );
}
