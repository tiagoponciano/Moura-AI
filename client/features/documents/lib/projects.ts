import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";

export type Project = { id: string; name: string };

/** Body of `POST /api/documents/projects`; the message is shown on screen. */
export const projectCreateSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do projeto")
    .max(120, "Nome muito longo"),
});

/** Id segment of `/api/documents/projects/[id]`. */
export const projectIdSchema = z.uuid();

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
