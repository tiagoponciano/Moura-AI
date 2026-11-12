import { requestJson } from "@/lib/api/request-json";
import type { Project, ProjectChange } from "./project";

export const fetchProjects = () =>
  requestJson<{ projects: Project[] }>("/api/documents/projects");

export const createProject = (name: string) =>
  requestJson<{ project: Project }>("/api/documents/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const renameProject = (id: string, name: string) =>
  requestJson<{ project: Project }>(`/api/documents/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

export const archiveProject = (id: string) =>
  requestJson<void>(`/api/documents/projects/${id}`, { method: "DELETE" });
export const updateProjectData = (id: string, data: ProjectChange) =>
  requestJson<void>(`/api/documents/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ data }),
  });
