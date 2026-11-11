import type { ConversationGuide, ConversationStep } from "./conversation-steps";

/** Name of the LLM tool that writes extracted values into the form. */
export const FILL_FIELDS_TOOL = "fill_fields";

export type FieldType = "string" | "number" | "date" | "boolean" | "choice";

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
  /** For `choice`: each option and the tag that gets its "X" in the document. */
  options?: { value: string; tag: string }[];
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
  /** Hand-written conversation steps; see `conversation-steps.ts`. */
  guide?: string;
  /** Set on a tagged copy of an official form: which form, and the text it was made from. */
  cbmsc?: {
    normative: number;
    annex: string;
    sourceTextHash: string;
    /** `false` when its fields came from the document's structure, unchecked by hand. */
    reviewed: boolean;
  };
};

export type FieldValue = string | number | boolean;
export type FieldValues = Record<string, FieldValue | undefined>;

/** What the chat tells the user before the first message (UI copy): the current step's question. */
export function chatEmptyState(
  schema: TemplateSchema,
  step?: ConversationStep,
): string {
  const intro =
    "Vou perguntar etapa por etapa. Responda com as suas palavras; a Moura AI preenche os campos ao lado.";
  if (!step) return `${intro} Todas as etapas já estão respondidas.`;
  if (step.question) return `${intro} ${step.question}`;
  const labels = schema.fields
    .filter((field) => step.fields.includes(field.name))
    .map((field) => field.label);
  return `${intro} Para começar: ${labels.join(", ")}.`;
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

export async function loadTemplateGuide(
  template: TemplateEntry,
): Promise<ConversationGuide | undefined> {
  return template.guide
    ? fetchJson<ConversationGuide>(template.guide)
    : undefined;
}

export function loadTemplateSchema(
  template: TemplateEntry,
): Promise<TemplateSchema> {
  return fetchJson<TemplateSchema>(template.schema);
}
