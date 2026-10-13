/** Name of the LLM tool that writes extracted values into the form. */
export const FILL_FIELDS_TOOL = "fill_fields";

export type FieldType = "string" | "number" | "date" | "boolean";

export type TemplateField = {
  name: string;
  type: FieldType;
  /** Short name shown in the field panel and in generation problems. */
  label: string;
  /** Longer hint for the model and the field tooltip. */
  description: string;
  required?: boolean;
};

export type TemplateSchema = {
  fields: TemplateField[];
};

export type TemplateEntry = {
  id: string;
  name: string;
  type: "docx";
  file: string;
  schema: string;
};

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue | undefined>;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function loadTemplateIndex(): Promise<TemplateEntry[]> {
  return fetchJson<TemplateEntry[]>("/templates/index.json");
}

export function loadTemplateSchema(
  template: TemplateEntry,
): Promise<TemplateSchema> {
  return fetchJson<TemplateSchema>(template.schema);
}
