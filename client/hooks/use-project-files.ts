"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { ProjectFile } from "@/lib/projects/files";
import { fetchProjectFiles, projectFileUrl } from "@/lib/projects/files-client";

/**
 * The files kept for a project, and downloading one. The list belongs to one
 * project: another project reads as loading until its own answer lands.
 */
export function useProjectFiles(projectId: string) {
  const [loaded, setLoaded] = useState<{
    projectId: string;
    files: ProjectFile[];
    error?: string;
  }>();

  useEffect(() => {
    let cancelled = false;
    fetchProjectFiles(projectId).then(
      (body) => {
        if (!cancelled) setLoaded({ projectId, files: body.files });
      },
      (cause) => {
        if (!cancelled) {
          setLoaded({ projectId, files: [], error: errorMessage(cause) });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /** Opens a link that works for a minute; a failure shows in `error`. */
  const download = useCallback(
    async (file: ProjectFile) => {
      try {
        const url = await projectFileUrl(file.storage_path, file.file_name);
        window.location.assign(url);
      } catch (cause) {
        setLoaded((current) =>
          current?.projectId === projectId
            ? { ...current, error: errorMessage(cause) }
            : current,
        );
      }
    },
    [projectId],
  );

  const own = loaded?.projectId === projectId ? loaded : undefined;
  return {
    files: own?.files ?? [],
    loading: own === undefined,
    error: own?.error,
    download,
  };
}
