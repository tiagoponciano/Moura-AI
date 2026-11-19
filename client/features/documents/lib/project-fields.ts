import type { ProjectData } from "@/lib/projects/project";
import type { FieldValues, TemplateSchema } from "./templates";

export {
  PROJECT_FIELD_GROUPS,
  PROJECT_FIELD_KEYS,
  fieldChange,
  groupProgress,
  isProjectFieldKey,
  type ProjectFieldGroup,
} from "@/lib/projects/fields";

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
