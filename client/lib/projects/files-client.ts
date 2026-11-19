import { requestJson } from "@/lib/api/request-json";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PROJECT_FILES_BUCKET,
  buildProjectFilePath,
  checkProjectFile,
  type ProjectFile,
  type ProjectFileKind,
} from "./files";

const MESSAGES = {
  empty: "O arquivo está vazio.",
  too_large: "Arquivo maior que 25 MB.",
  failed: "Não foi possível enviar o arquivo.",
} as const;

/** Carries the Portuguese message to show for a failed upload. */
export class ProjectFileError extends Error {
  constructor(fileName: string, problem: keyof typeof MESSAGES) {
    super(`${fileName}: ${MESSAGES[problem]}`);
  }
}

export const fetchProjectFiles = (projectId: string) =>
  requestJson<{ files: ProjectFile[] }>(`/api/projects/${projectId}/files`);

/**
 * Browser-only. Uploads straight to the project's folder in the bucket, then
 * records the file through the API. The object is removed again if recording
 * fails, so nothing is stored without a row.
 */
export async function uploadProjectFile(
  projectId: string,
  file: Blob,
  options: { kind: ProjectFileKind; fileName: string },
): Promise<ProjectFile> {
  const problem = checkProjectFile(file.size);
  if (problem) throw new ProjectFileError(options.fileName, problem);

  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new ProjectFileError(options.fileName, "failed");
  const bucket = supabase.storage.from(PROJECT_FILES_BUCKET);
  const storagePath = buildProjectFilePath(
    projectId,
    options.fileName,
    crypto.randomUUID(),
  );
  const mimeType = file.type || "application/octet-stream";
  const { error: uploadError } = await bucket.upload(storagePath, file, {
    contentType: mimeType,
  });
  if (uploadError) {
    console.error("Failed to upload the project file", uploadError);
    throw new ProjectFileError(options.fileName, "failed");
  }

  try {
    const { file: recorded } = await requestJson<{ file: ProjectFile }>(
      `/api/projects/${projectId}/files`,
      {
        method: "POST",
        body: JSON.stringify({
          kind: options.kind,
          fileName: options.fileName,
          mimeType,
          sizeBytes: file.size,
          storagePath,
        }),
      },
    );
    return recorded;
  } catch (cause) {
    console.error("Failed to record the project file", cause);
    await bucket.remove([storagePath]);
    throw new ProjectFileError(options.fileName, "failed");
  }
}

export const deleteProjectFile = (projectId: string, fileId: string) =>
  requestJson<void>(`/api/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });

/** Browser-only. A link that works for a minute, made with the signed-in user's session. */
export async function projectFileUrl(
  storagePath: string,
  downloadName?: string,
): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .createSignedUrl(storagePath, 60, { download: downloadName ?? true });
  if (error || !data) throw new Error("Failed to create the download link");
  return data.signedUrl;
}
