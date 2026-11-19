"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { ProjectFile } from "@/lib/projects/files";
import {
  deleteProjectFile,
  fetchProjectFiles,
  projectFileUrl,
  uploadProjectFile,
} from "@/lib/projects/files-client";

/** The files of one project, with upload, download and removal. Mount it per project. */
export function useProjectFiles(projectId: string) {
  const [files, setFiles] = useState<ProjectFile[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProjectFiles(projectId).then(
      (body) => setFiles(body.files),
      (cause) => setError(errorMessage(cause)),
    );
  }, [projectId]);

  /** Uploads each file as `other`; a failure is shown and the others still go. */
  async function upload(chosen: File[]) {
    setBusy(true);
    setError(undefined);
    for (const file of chosen) {
      try {
        const recorded = await uploadProjectFile(projectId, file, {
          kind: "other",
          fileName: file.name,
        });
        setFiles((current) => [recorded, ...(current ?? [])]);
      } catch (cause) {
        setError(errorMessage(cause));
      }
    }
    setBusy(false);
  }

  async function remove(file: ProjectFile) {
    setError(undefined);
    try {
      await deleteProjectFile(projectId, file.id);
      setFiles((current) => current?.filter((entry) => entry.id !== file.id));
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function download(file: ProjectFile) {
    setError(undefined);
    try {
      const url = await projectFileUrl(file.storage_path, file.file_name);
      window.location.assign(url);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  return { files, error, busy, upload, remove, download };
}
