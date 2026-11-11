import type { Filling } from "./fillings";
import type { TemplateEntry } from "./templates";

export type StartedForm = {
  templateId: string;
  name: string;
  updatedAt: string;
};

/** The project's saved forms that still exist as templates, newest first. */
export function startedForms(
  fillings: Filling[],
  templates: TemplateEntry[],
): StartedForm[] {
  const names = new Map(
    templates.map((template) => [template.id, template.name]),
  );
  return fillings
    .flatMap((filling) => {
      const name = names.get(filling.template_id);
      return name === undefined
        ? []
        : [
            {
              templateId: filling.template_id,
              name,
              updatedAt: filling.updated_at,
            },
          ];
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
