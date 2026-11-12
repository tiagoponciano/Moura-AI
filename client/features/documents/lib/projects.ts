import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";
import { isProjectFieldKey } from "./project-fields";
import {
  projectCreateSchema,
  type Project,
  type ProjectChange,
} from "@/lib/projects/project";

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
