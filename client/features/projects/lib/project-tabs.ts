import { PROJECT_FIELD_GROUPS } from "@/lib/projects/fields";

/** The tabs of a project's page; each data tab shows some of the field groups. */
export const PROJECT_TABS = [
  { id: "summary", label: "Resumo", groups: [] },
  { id: "client", label: "Cliente", groups: ["owner", "applicant"] },
  { id: "property", label: "Imóvel", groups: ["property", "building"] },
  { id: "team", label: "Equipe", groups: ["technical", "accountant"] },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]["id"];

/** The field groups of a tab, in the order the tab lists them. */
export function groupsOfTab(tab: ProjectTabId) {
  const ids: readonly string[] =
    PROJECT_TABS.find((entry) => entry.id === tab)?.groups ?? [];
  return ids.flatMap((id) => {
    const group = PROJECT_FIELD_GROUPS.find((entry) => entry.id === id);
    return group ? [group] : [];
  });
}
