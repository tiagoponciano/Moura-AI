import {
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  columnFilteringFeature,
  tableFeatures,
  type FilterFn,
  type SortFn,
} from "@tanstack/react-table";
import { normalize } from "@/lib/projects/filter-projects";
import type { Project } from "@/lib/projects/project";
import { summarizeProject } from "./project-summary";

/** What one row of the projects table shows. */
export type ProjectRow = {
  project: Project;
  city?: string;
  occupancy?: string;
  /** The area as a number, or `undefined` when the project has none or it is not a number. */
  area?: number;
};

export const PROJECTS_PAGE_SIZE = 10;

/** Client-side search, sorting and pages; the list is small and already loaded. */
export const PROJECTS_TABLE_FEATURES = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

type ProjectsFeatures = typeof PROJECTS_TABLE_FEATURES;

/** A number from `"820"` or `"1.250,5"` style text; `undefined` when it is not one. */
export function parseArea(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const value = Number(text.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

/** The rows of the table, one per project. */
export function toProjectRows(projects: Project[]): ProjectRow[] {
  return projects.map((project) => {
    const { city, occupancy, area } = summarizeProject(project);
    return { project, city, occupancy, area: parseArea(area) };
  });
}

/** Whether every word of `query` is in the name, the city or the occupation, ignoring accents and case. */
export function matchesProjectQuery(row: ProjectRow, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const text = normalize(
    [row.project.name, row.city, row.occupancy].filter(Boolean).join(" "),
  );
  return words.every((word) => text.includes(word));
}

/** Global filter: the search box against name, city and occupation. */
export const globalProjectFilter: FilterFn<ProjectsFeatures, ProjectRow> = (
  row,
  _columnId,
  query,
) => matchesProjectQuery(row.original, String(query ?? ""));

/** Ascending text order in pt-BR; a blank sorts before any text. */
export const compareProjectText: SortFn<ProjectsFeatures, ProjectRow> = (
  a,
  b,
  columnId,
) =>
  String(a.getValue(columnId) ?? "").localeCompare(
    String(b.getValue(columnId) ?? ""),
    "pt-BR",
  );

/** Ascending numeric order; a project with no area sorts before any area. */
export const compareProjectArea: SortFn<ProjectsFeatures, ProjectRow> = (
  a,
  b,
  columnId,
) => Number(a.getValue(columnId) ?? -1) - Number(b.getValue(columnId) ?? -1);

/** `"Mostrando 11 a 20 de 23"`, or `undefined` for an empty list. */
export function pageRange(
  pageIndex: number,
  pageSize: number,
  total: number,
): string | undefined {
  if (total === 0) return undefined;
  const from = pageIndex * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);
  return `Mostrando ${from} a ${to} de ${total}`;
}
