export type FieldType = "string" | "number" | "date" | "boolean";

export type TemplateField = {
  nome: string;
  tipo: FieldType;
  descricao: string;
  obrigatorio?: boolean;
};

export type TemplateSchema = {
  campos: TemplateField[];
};

export type TemplateEntry = {
  id: string;
  nome: string;
  tipo: "docx";
  arquivo: string;
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

export function loadTemplateSchema(template: TemplateEntry): Promise<TemplateSchema> {
  return fetchJson<TemplateSchema>(template.schema);
}
