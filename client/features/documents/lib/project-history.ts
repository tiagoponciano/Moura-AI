import { requestJson } from "@/lib/api/request-json";
import { PROJECT_FIELD_GROUPS } from "./project-fields";

export type ProjectChangeRecord = {
  id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string | null;
  changed_at: string;
};

const FIELD_LABEL = new Map<string, string>([
  ["name", "Nome do projeto"],
  ...PROJECT_FIELD_GROUPS.flatMap((group) =>
    group.fields.map(
      (field) => [field.key, `${group.title}: ${field.label}`] as const,
    ),
  ),
]);

/** A field's name as the screen shows it; an unknown key is shown as it is. */
export const fieldLabel = (field: string) => FIELD_LABEL.get(field) ?? field;

/** What a change did, in one line: filled, cleared or changed. */
export function describeChange(
  change: Pick<ProjectChangeRecord, "field" | "old_value" | "new_value">,
): string {
  const label = fieldLabel(change.field);
  if (change.old_value === null)
    return `${label}: preenchido com “${change.new_value}”`;
  if (change.new_value === null)
    return `${label}: apagado (era “${change.old_value}”)`;
  return `${label}: “${change.old_value}” → “${change.new_value}”`;
}

export const fetchProjectHistory = (projectId: string) =>
  requestJson<{ changes: ProjectChangeRecord[] }>(
    `/api/documents/projects/${projectId}/history`,
  );
