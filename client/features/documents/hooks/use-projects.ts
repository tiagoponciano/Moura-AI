"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { createProject, fetchProjects, type Project } from "../lib/projects";

/** The team's projects and the one being worked on; a new project becomes the current one. */
export function useProjects(enabled: boolean) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    fetchProjects().then(
      (body) => setProjects(body.projects),
      (cause) => setError(errorMessage(cause)),
    );
  }, [enabled]);

  /** Resolves to whether it was created, so the field can clear. */
  async function create(name: string) {
    setCreating(true);
    setError(undefined);
    try {
      const { project } = await createProject(name);
      setProjects((current) =>
        [...current, project].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        ),
      );
      setSelectedId(project.id);
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setCreating(false);
    }
  }

  return {
    projects,
    selected: projects.find((project) => project.id === selectedId),
    select: setSelectedId,
    create,
    creating,
    error,
  };
}
