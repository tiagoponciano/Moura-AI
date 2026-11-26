import { fieldChange, type ProjectFieldGroup } from "@/lib/projects/fields";
import type { ProjectChange, ProjectData } from "@/lib/projects/project";

/** What saving a group's draft changes: only the fields that differ, a blank one removing its key; `undefined` when nothing differs. */
export function groupChange(
  group: ProjectFieldGroup,
  draft: Record<string, string>,
  data: ProjectData,
): ProjectChange | undefined {
  const change: ProjectChange = {};
  for (const field of group.fields) {
    const next = fieldChange(field.key, draft[field.key] ?? "", data);
    if (next) Object.assign(change, next);
  }
  return Object.keys(change).length ? change : undefined;
}

/** The draft a group's dialog starts from: the saved value of each field, or blank. */
export function groupDraft(
  group: ProjectFieldGroup,
  data: ProjectData,
): Record<string, string> {
  return Object.fromEntries(
    group.fields.map((field) => [field.key, data[field.key] ?? ""]),
  );
}
