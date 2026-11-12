import type { ProjectChange, ProjectData } from "@/lib/projects/project";
import type { FieldValues, TemplateSchema } from "./templates";

/** What a project remembers across forms, as its panel shows it (labels are UI copy). */
export const PROJECT_FIELD_GROUPS = [
  {
    id: "property",
    title: "Imóvel",
    fields: [
      { key: "property_street", label: "Logradouro" },
      { key: "property_number", label: "Número" },
      { key: "property_complement", label: "Complemento" },
      { key: "property_district", label: "Bairro" },
      { key: "property_city", label: "Cidade" },
      { key: "property_postal_code", label: "CEP" },
      { key: "property_re", label: "RE" },
      { key: "property_cnpj", label: "CNPJ" },
      { key: "property_protocol", label: "Protocolo" },
      { key: "property_occupancy", label: "Ocupação" },
      { key: "property_building_name", label: "Nome da edificação" },
      { key: "property_company_name", label: "Nome da empresa" },
      { key: "property_total_area", label: "Área total (m²)" },
      { key: "property_floors", label: "Nº de pavimentos" },
      { key: "property_blocks", label: "Nº de blocos" },
      { key: "property_details", label: "Detalhes" },
    ],
  },
  {
    id: "owner",
    title: "Responsável pelo imóvel",
    fields: [
      { key: "owner_name", label: "Nome ou razão social" },
      { key: "owner_tax_id", label: "CPF/CNPJ" },
      { key: "owner_id_card", label: "RG" },
      { key: "owner_email", label: "E-mail" },
      { key: "owner_phone", label: "Telefone" },
      { key: "owner_street", label: "Logradouro" },
      { key: "owner_number", label: "Número" },
      { key: "owner_complement", label: "Complemento" },
      { key: "owner_district", label: "Bairro" },
      { key: "owner_city", label: "Cidade" },
      { key: "owner_postal_code", label: "CEP" },
    ],
  },
  {
    id: "technical",
    title: "Responsável técnico",
    fields: [
      { key: "technical_name", label: "Nome" },
      { key: "technical_tax_id", label: "CPF/CNPJ" },
      { key: "technical_id_card", label: "RG" },
      { key: "technical_registry", label: "Nº de registro" },
      { key: "technical_email", label: "E-mail" },
      { key: "technical_phone", label: "Telefone" },
      { key: "technical_street", label: "Logradouro" },
      { key: "technical_number", label: "Número" },
      { key: "technical_complement", label: "Complemento" },
      { key: "technical_district", label: "Bairro" },
      { key: "technical_city", label: "Cidade" },
      { key: "technical_postal_code", label: "CEP" },
    ],
  },
] as const;

export type ProjectFieldGroup = (typeof PROJECT_FIELD_GROUPS)[number];

export const PROJECT_FIELD_KEYS: readonly string[] =
  PROJECT_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key),
  );

export const isProjectFieldKey = (key: string) =>
  PROJECT_FIELD_KEYS.includes(key);

/** How many of a group's fields the project has, for its toggle. */
export function groupProgress(group: ProjectFieldGroup, data: ProjectData) {
  return {
    filled: group.fields.filter((field) => data[field.key]).length,
    total: group.fields.length,
  };
}

/** What a field edited in the panel changes; `undefined` when nothing did. */
export function fieldChange(
  key: string,
  value: string,
  data: ProjectData,
): ProjectChange | undefined {
  const clean = value.trim();
  if (clean === (data[key] ?? "")) return undefined;
  return { [key]: clean || null };
}

/** The form values a project already knows. */
export function valuesFromProject(
  schema: TemplateSchema,
  data: ProjectData,
): FieldValues {
  const values: FieldValues = {};
  for (const field of schema.fields) {
    const value = field.projectKey && data[field.projectKey];
    if (value) values[field.name] = value;
  }
  return values;
}

/** The form's shared values that differ from the project; a blank never erases. */
export function changedProjectData(
  schema: TemplateSchema,
  values: FieldValues,
  data: ProjectData,
): ProjectData {
  const changed: ProjectData = {};
  for (const field of schema.fields) {
    const value = values[field.name];
    if (!field.projectKey || typeof value !== "string") continue;
    const clean = value.trim();
    if (clean && clean !== data[field.projectKey]) {
      changed[field.projectKey] = clean;
    }
  }
  return changed;
}
