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

/** Body of `PATCH /api/documents/projects/:id`: the keys to merge into its data; `null` clears one. */
export const projectUpdateSchema = z.strictObject({
  data: z
    .record(z.string(), z.string().trim().min(1).max(2000).nullable())
    .refine((data) => Object.keys(data).every(isProjectFieldKey), {
      message: "Unknown project field",
    }),
});

export const fetchProjects = () =>
  requestJson<{ projects: Project[] }>("/api/documents/projects");

export const createProject = (name: string) =>
  requestJson<{ project: Project }>("/api/documents/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

export const updateProjectData = (id: string, data: ProjectChange) =>
  requestJson<void>(`/api/documents/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ data }),
  });
