import type { Project } from "@/lib/projects/project";

/** Lowercase without accents, so `"edificio"` finds `"Edifício"`. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** The projects whose name contains every word of `query`, in the given order. */
export function filterProjects(projects: Project[], query: string): Project[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return projects;
  return projects.filter((project) => {
    const name = normalize(project.name);
    return words.every((word) => name.includes(word));
  });
}
