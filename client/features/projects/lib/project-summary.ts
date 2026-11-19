import type { Project } from "@/lib/projects/project";

/** What the projects list shows about a project; a blank is `undefined`. */
export type ProjectSummary = {
  city?: string;
  occupancy?: string;
  area?: string;
};

const pick = (project: Project, ...keys: string[]) =>
  keys.map((key) => project.data[key]).find((value) => value);

/** The city, occupation and area a project already knows, from the block or the property. */
export function summarizeProject(project: Project): ProjectSummary {
  return {
    city: pick(project, "property_city"),
    occupancy: pick(project, "property_occupancy"),
    area: pick(project, "block_area", "property_total_area"),
  };
}

/** `820` as `820 m²`; text that is not a plain number is shown as it came. */
export function formatArea(area: string | undefined): string | undefined {
  if (!area) return undefined;
  const value = Number(area.replace(",", "."));
  return Number.isFinite(value) ? `${value.toLocaleString("pt-BR")} m²` : area;
}
