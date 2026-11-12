"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  archiveProject,
  createProject,
  fetchProjects,
  renameProject,
  updateProjectData,
} from "../lib/projects";
import {
  type Project,
  type ProjectChange,
  mergeProjectData,
} from "@/lib/projects/project";

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

  /** Resolves to whether it was renamed, so the dialog can close. */
  async function rename(id: string, name: string) {
    setError(undefined);
    try {
      const { project } = await renameProject(id, name);
      setProjects((current) =>
        current
          .map((item) => (item.id === id ? project : item))
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      );
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    }
  }

  /** Resolves to whether it was archived; the project leaves the list and the selection. */
  async function archive(id: string) {
    setError(undefined);
    try {
      await archiveProject(id);
      setProjects((current) => current.filter((item) => item.id !== id));
      setSelectedId((current) => (current === id ? undefined : current));
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    }
  }

  /** Merges keys into a project, here at once and on the server behind it. */
  const saveData = useCallback((id: string, change: ProjectChange) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? { ...project, data: mergeProjectData(project.data, change) }
          : project,
      ),
    );
    updateProjectData(id, change).catch((cause) =>
      setError(errorMessage(cause)),
    );
  }, []);

  return {
    projects,
    selected: projects.find((project) => project.id === selectedId),
    select: setSelectedId,
    create,
    rename,
    archive,

    saveData,
    creating,
    error,
  };
}
