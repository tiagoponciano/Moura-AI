import { schemaToZod } from "./schema-to-zod";
import type { FieldValue, FieldValues, TemplateSchema } from "./templates";

export function isEmptyValue(value: FieldValue | undefined): boolean {
  return (
    value === undefined || (typeof value === "string" && value.trim() === "")
  );
}

/**
 * Keeps only the entries of a tool output that belong to the schema and hold a
 * non-empty scalar, so they can be merged into the form.
 */
export function pickExtractedValues(
  schema: TemplateSchema,
  output: unknown,
): FieldValues {
  if (!output || typeof output !== "object") return {};
  const known = new Set(schema.fields.map((field) => field.name));
  const extracted = Object.entries(output as Record<string, unknown>).filter(
    ([name, value]) =>
      known.has(name) &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean") &&
      !isEmptyValue(value),
  );
  return Object.fromEntries(extracted) as FieldValues;
}

export function requiredProgress(
  schema: TemplateSchema,
  values: FieldValues,
): { filled: number; total: number } {
  const required = schema.fields.filter((field) => field.required);
  const filled = required.filter(
    (field) => field.type === "boolean" || !isEmptyValue(values[field.name]),
  ).length;
  return { filled, total: required.length };
}

export type DocumentValidation =
  { ok: true; values: FieldValues } | { ok: false; problems: string[] };

/** Drops empty values, defaults unset booleans to false, and validates against the schema's `document` rules. */
export function validateForDocument(
  schema: TemplateSchema,
  values: FieldValues,
): DocumentValidation {
  // An untouched switch shows "Não", so an unset boolean means false.
  const booleanDefaults = Object.fromEntries(
    schema.fields
      .filter((field) => field.type === "boolean")
      .map((field) => [field.name, false]),
  );
  const cleaned = Object.fromEntries(
    Object.entries({ ...booleanDefaults, ...values }).filter(
      ([, value]) => !isEmptyValue(value),
    ),
  );
  const result = schemaToZod(schema, "document").safeParse(cleaned);
  if (result.success) return { ok: true, values: cleaned };

  const labels = new Map(
    schema.fields.map((field) => [field.name, field.label]),
  );
  const problems = result.error.issues.map((issue) => {
    const name = String(issue.path[0]);
    const label = labels.get(name) ?? name;
    return cleaned[name] === undefined
      ? `${label}: obrigatório`
      : `${label}: ${issue.message}`;
  });
  return { ok: false, problems: [...new Set(problems)] };
}
