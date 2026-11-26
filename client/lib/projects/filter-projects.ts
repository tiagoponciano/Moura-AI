import type { Project } from "@/lib/projects/project";

/** Lowercase without accents, so `"edificio"` finds `"Edifício"`. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** The line under a project's name in a list: its city, occupancy and client, as many as it has. */
export function projectDetails(project: Project): string {
  const { property_city, property_occupancy, owner_name } = project.data;
  return [property_city, property_occupancy, owner_name]
    .filter(Boolean)
    .join(" · ");
}

/** The projects where every word of `query` is in the name, the city, the occupancy or the client, in the given order. */
export function filterProjects(projects: Project[], query: string): Project[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return projects;
  return projects.filter((project) => {
    const text = normalize(`${project.name} ${projectDetails(project)}`);
    return words.every((word) => text.includes(word));
  });
}
