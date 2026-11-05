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
  /** A `( )` option in the document: true prints "X", false prints nothing. */
  mark?: boolean;
  /** The project data this field shares; see `project-fields.ts`. */
  projectKey?: string;
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
  /** Set on a tagged copy of an official form: which form, and the text it was made from. */
  cbmsc?: { normative: number; annex: string; sourceTextHash: string };
};

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue | undefined>;

/** What the chat tells the user before the first message (UI copy). */
export function chatEmptyState(schema: TemplateSchema): string {
  const required = schema.fields
    .filter((field) => field.required)
    .map((field) => field.label);
  const intro =
    "Conte os dados com as suas palavras, tudo de uma vez ou aos poucos. A Moura AI preenche os campos ao lado e pergunta o que faltar.";
  return required.length
    ? `${intro} Para começar, preciso de: ${required.join(", ")}.`
    : intro;
}

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
