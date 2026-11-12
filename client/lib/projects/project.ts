import { z } from "zod";

/** A project's shared values, keyed by field. */
export type ProjectData = Record<string, string>;

/** Keys to merge into a project's data; `null` clears one. */
export type ProjectChange = Record<string, string | null>;

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

/** A project's data after a change: other keys stay, and `null` removes a key. */
export function mergeProjectData(
  data: ProjectData,
  change: ProjectChange,
): ProjectData {
  const merged: ProjectData = { ...data };
  for (const [key, value] of Object.entries(change)) {
    if (value === null) delete merged[key];
    else merged[key] = value;
  }
  return merged;
}
