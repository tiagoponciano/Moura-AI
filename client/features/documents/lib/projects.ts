import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";
import {
  isProjectFieldKey,
  type ProjectChange,
  type ProjectData,
} from "./project-fields";

export type Project = { id: string; name: string; data: ProjectData };

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

/** Body of `PATCH /api/documents/projects/:id`: a new name, keys to merge into its data (`null` clears one), or both. */
export const projectUpdateSchema = z
  .strictObject({
    name: projectCreateSchema.shape.name.optional(),
    data: z
      .record(z.string(), z.string().trim().min(1).max(2000).nullable())
      .refine((data) => Object.keys(data).every(isProjectFieldKey), {
        message: "Unknown project field",
      })
      .optional(),
  })
  .refine((body) => body.name !== undefined || body.data !== undefined, {
    message: "Nothing to update",
  });

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
