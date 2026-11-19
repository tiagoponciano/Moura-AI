import { z } from "zod";

/** Supabase Storage bucket created by supabase/migrations/*_project_files.sql. */
export const PROJECT_FILES_BUCKET = "project-files";

/** Keep in sync with the bucket's `file_size_limit`. */
export const PROJECT_FILE_MAX_BYTES = 25 * 1024 * 1024;

export const PROJECT_FILE_KINDS = [
  "form",
  "proposal",
  "plan",
  "conversion",
  "other",
] as const;
export type ProjectFileKind = (typeof PROJECT_FILE_KINDS)[number];

/** Where a file comes from, as the list shows it (UI copy). */
export const PROJECT_FILE_KIND_LABEL: Record<ProjectFileKind, string> = {
  form: "Documentos",
  proposal: "Proposta",
  plan: "Plantas · enviada",
  conversion: "Plantas · convertida",
  other: "Outro",
};

/** Body of `POST /api/projects/:id/files`: an object already uploaded to the bucket. */
export const projectFileRecordBody = z.strictObject({
  kind: z.enum(PROJECT_FILE_KINDS),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().min(1).max(PROJECT_FILE_MAX_BYTES),
  storagePath: z.string().min(3).max(600),
});
export type ProjectFileRecord = z.infer<typeof projectFileRecordBody>;

/** One file kept for a project. */
export type ProjectFile = {
  id: string;
  kind: ProjectFileKind;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

export type ProjectFileProblem = "empty" | "too_large";

export function checkProjectFile(
  sizeBytes: number,
): ProjectFileProblem | undefined {
  if (sizeBytes <= 0) return "empty";
  if (sizeBytes > PROJECT_FILE_MAX_BYTES) return "too_large";
  return undefined;
}

/** `<projectId>/<id>-<safe name>`: the table only accepts a path that starts with the project's id. */
export function buildProjectFilePath(
  projectId: string,
  fileName: string,
  id: string,
): string {
  const safeName =
    fileName
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^A-Za-z0-9._-]+/g, "_")
      .replace(/^[._]+/, "")
      .slice(-120) || "arquivo";
  return `${projectId}/${id}-${safeName}`;
}

/** `1,2 MB`, `380 KB` or `42 B`, in the Brazilian format. */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  }
  if (bytes >= 1024)
    return `${Math.round(bytes / 1024).toLocaleString("pt-BR")} KB`;
  return `${bytes} B`;
}
