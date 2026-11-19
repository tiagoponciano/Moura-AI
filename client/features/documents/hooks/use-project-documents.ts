"use client";

import { useEffect, useMemo, useState } from "react";
import { useProjectFiles } from "@/hooks/use-project-files";
import { errorMessage } from "@/lib/api/request-json";
import { fetchFillings, type Filling } from "../lib/fillings";
import { projectDocuments } from "../lib/project-documents";
import { loadTemplateIndex, type TemplateEntry } from "../lib/templates";

type Loaded = {
  projectId: string;
  fillings: Filling[];
  templates: TemplateEntry[];
  error?: string;
};

/** The forms started for a project and the documents kept for them, with download. */
export function useProjectDocuments(projectId: string) {
  const [loaded, setLoaded] = useState<Loaded>();
  const files = useProjectFiles(projectId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFillings(projectId), loadTemplateIndex()]).then(
      ([body, templates]) => {
        if (!cancelled) {
          setLoaded({ projectId, fillings: body.fillings, templates });
        }
      },
      (cause) => {
        if (!cancelled) {
          setLoaded({
            projectId,
            fillings: [],
            templates: [],
            error: errorMessage(cause),
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const own = loaded?.projectId === projectId ? loaded : undefined;
  const documents = useMemo(
    () =>
      projectDocuments(own?.fillings ?? [], own?.templates ?? [], files.files),
    [own, files.files],
  );

  return {
    ...documents,
    loading: own === undefined || files.loading,
    error: own?.error ?? files.error,
    download: files.download,
  };
}
