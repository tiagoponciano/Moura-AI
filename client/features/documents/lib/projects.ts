import { z } from "zod";
import { isProjectFieldKey } from "./project-fields";
import { projectCreateSchema } from "@/lib/projects/project";

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
