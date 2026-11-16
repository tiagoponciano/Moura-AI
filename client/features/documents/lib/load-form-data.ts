import { recordSources, type FieldSources } from "@/lib/field-sources";
import type { ConversationGuide } from "./conversation-steps";
import { fetchFillings, type Filling } from "./fillings";
import { pickExtractedValues } from "./form-values";
import { valuesFromProject } from "./project-fields";
import {
  loadTemplateGuide,
  loadTemplateSchema,
  type FieldValues,
  type TemplateEntry,
  type TemplateSchema,
} from "./templates";
import type { ProjectData } from "@/lib/projects/project";

export type LoadedForm = {
  schema: TemplateSchema;
  guide: ConversationGuide | undefined;
  /** What was saved for every form of the project. */
  fillings: Filling[];
  /** The project's values overlaid with the ones saved for this form. */
  values: FieldValues;
  sources: FieldSources;
};

/** Loads a form's fields and guide, and fills it from the project and what the user saved before. */
export async function loadFormData(
  template: TemplateEntry,
  projectId: string | undefined,
  projectData: ProjectData,
): Promise<LoadedForm> {
  const [schema, guide, fillings] = await Promise.all([
    loadTemplateSchema(template),
    loadTemplateGuide(template),
    projectId
      ? fetchFillings(projectId).then(
          (body) => body.fillings,
          () => [] as Filling[],
        )
      : ([] as Filling[]),
  ]);
  const own = fillings.find((filling) => filling.template_id === template.id);
  const saved = pickExtractedValues(schema, own?.values);
  const values = { ...valuesFromProject(schema, projectData), ...saved };
  const sources = recordSources(
    recordSources({}, Object.keys(values), "project"),
    Object.keys(saved),
    "user",
  );
  return { schema, guide, fillings, values, sources };
}
