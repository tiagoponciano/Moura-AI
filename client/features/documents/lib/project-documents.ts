import type { ProjectFile } from "@/lib/projects/files";
import type { Filling } from "./fillings";
import { startedForms, type StartedForm } from "./started-forms";
import type { TemplateEntry } from "./templates";

export type ProjectForm = StartedForm & {
  /** The latest `.docx` generated for this form and kept in the project. */
  document?: ProjectFile;
};

export type ProjectDocuments = {
  forms: ProjectForm[];
  proposal?: ProjectFile;
};

const newestFirst = (a: ProjectFile, b: ProjectFile) =>
  b.created_at.localeCompare(a.created_at);

/** `documentFileName` names a document `<id>.<ext>` or `<id>_<company>.<ext>`. */
const namesTemplate = (fileName: string, templateId: string) =>
  fileName.startsWith(`${templateId}.`) ||
  fileName.startsWith(`${templateId}_`);

/**
 * What the documents module holds for a project: the forms started, each with
 * the latest document generated for it, and the latest proposal. A file goes to
 * the template with the longest id its name starts with, so `form_b.docx` is not
 * taken by `form`.
 */
export function projectDocuments(
  fillings: Filling[],
  templates: TemplateEntry[],
  files: ProjectFile[],
): ProjectDocuments {
  const ids = templates
    .map((template) => template.id)
    .sort((a, b) => b.length - a.length);
  const latest = new Map<string, ProjectFile>();
  for (const file of files.filter((entry) => entry.kind === "form")) {
    const id = ids.find((templateId) =>
      namesTemplate(file.file_name, templateId),
    );
    const current = id ? latest.get(id) : undefined;
    if (id && (!current || newestFirst(file, current) < 0))
      latest.set(id, file);
  }

  return {
    forms: startedForms(fillings, templates).map((form) => ({
      ...form,
      document: latest.get(form.templateId),
    })),
    proposal: files
      .filter((file) => file.kind === "proposal")
      .sort(newestFirst)[0],
  };
}
