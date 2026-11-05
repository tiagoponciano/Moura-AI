"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { ProjectData } from "../lib/project-fields";
import {
  createProject,
  fetchProjects,
  updateProjectData,
  type Project,
} from "../lib/projects";

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

  /** Merges keys into a project, here at once and on the server behind it. */
  const saveData = useCallback((id: string, data: ProjectData) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? { ...project, data: { ...project.data, ...data } }
          : project,
      ),
    );
    updateProjectData(id, data).catch((cause) => setError(errorMessage(cause)));
  }, []);

  return {
    projects,
    selected: projects.find((project) => project.id === selectedId),
    select: setSelectedId,
    create,
    saveData,
    creating,
    error,
  };
}
