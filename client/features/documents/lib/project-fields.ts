import type { FieldValues, TemplateSchema } from "./templates";

/** What a project remembers across forms: the property, its owner and the engineer. */
export const PROJECT_FIELD_KEYS = [
  "property_street",
  "property_number",
  "property_complement",
  "property_district",
  "property_city",
  "property_postal_code",
  "property_re",
  "property_cnpj",
  "property_protocol",
  "property_occupancy",
  "property_building_name",
  "property_company_name",
  "property_details",
  "owner_name",
  "owner_email",
  "owner_phone",
  "technical_name",
  "technical_tax_id",
  "technical_id_card",
  "technical_email",
  "technical_phone",
  "technical_registry",
  "technical_street",
  "technical_number",
  "technical_complement",
  "technical_district",
  "technical_city",
  "technical_postal_code",
] as const;

export type ProjectData = Record<string, string>;

export const isProjectFieldKey = (key: string) =>
  (PROJECT_FIELD_KEYS as readonly string[]).includes(key);

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
