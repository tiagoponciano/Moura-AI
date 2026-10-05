import { z } from "zod";
import type { TemplateField, TemplateSchema } from "./templates";

export const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

type Mode = "extraction" | "document";

function fieldToZod(field: TemplateField, mode: Mode): z.ZodType {
  switch (field.type) {
    case "string":
      return (
        mode === "document" ? z.string().trim().min(1) : z.string()
      ).describe(field.description);
    case "number":
      return z.number().describe(field.description);
    case "boolean":
      return z.boolean().describe(field.description);
    case "date":
      return z
        .string()
        .regex(DATE_PATTERN, "Use o formato DD/MM/AAAA")
        .describe(`${field.description} (formato DD/MM/AAAA)`);
  }
}

/**
 * Builds a zod object from a template schema.
 * - `extraction`: every field optional (input of the `fill_fields` tool).
 * - `document`: required fields enforced (validation before rendering).
 */
export function schemaToZod(schema: TemplateSchema, mode: Mode) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of schema.fields) {
    const base = fieldToZod(field, mode);
    shape[field.name] =
      mode === "document" && field.required ? base : base.optional();
  }
  return z.object(shape);
}
