import { normalize } from "@/lib/projects/filter-projects";
import type { ProjectFile, ProjectFileKind } from "@/lib/projects/files";

export type FileFilterId = "all" | "forms" | "proposals" | "plans" | "other";

/** The toggles over a project's files, each with the kinds it shows. */
export const FILE_FILTERS: {
  id: FileFilterId;
  label: string;
  kinds?: ProjectFileKind[];
}[] = [
  { id: "all", label: "Todos" },
  { id: "forms", label: "Documentos", kinds: ["form"] },
  { id: "proposals", label: "Propostas", kinds: ["proposal"] },
  { id: "plans", label: "Plantas", kinds: ["plan", "conversion"] },
  { id: "other", label: "Outros", kinds: ["other"] },
];

/** The files a toggle shows, in the order given. */
export function filterFiles(
  files: ProjectFile[],
  filter: FileFilterId,
): ProjectFile[] {
  const kinds = FILE_FILTERS.find((entry) => entry.id === filter)?.kinds;
  return kinds ? files.filter((file) => kinds.includes(file.kind)) : files;
}

/** The files whose name has every word of `query`, ignoring accents and case. */
export function searchFiles(
  files: ProjectFile[],
  query: string,
): ProjectFile[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return files;
  return files.filter((file) => {
    const name = normalize(file.file_name);
    return words.every((word) => name.includes(word));
  });
}

/** How many files each toggle would show, for the count beside its name. */
export function countByFilter(
  files: ProjectFile[],
): Record<FileFilterId, number> {
  return Object.fromEntries(
    FILE_FILTERS.map((entry) => [
      entry.id,
      filterFiles(files, entry.id).length,
    ]),
  ) as Record<FileFilterId, number>;
}

/** What a file is called in the list. */
export const FILE_KIND_LABEL: Record<ProjectFileKind, string> = {
  form: "Documento",
  proposal: "Proposta",
  plan: "Planta enviada",
  conversion: "Planta convertida",
  other: "Outro",
};
