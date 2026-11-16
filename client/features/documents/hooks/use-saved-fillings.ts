"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { Project } from "@/lib/projects/project";
import { fetchFillings, saveFilling, type Filling } from "../lib/fillings";
import type { FieldValues, TemplateEntry } from "../lib/templates";

/** What was saved for each form of the current project, and saving the open form. */
export function useSavedFillings(
  project: Project | undefined,
  template: TemplateEntry | undefined,
  setNotice: (message: string | undefined) => void,
) {
  /** What was saved for each form, with the project it belongs to. */
  const [saved, setSaved] = useState<{ projectId?: string; list: Filling[] }>({
    list: [],
  });
  const projectId = project?.id;

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetchFillings(projectId).then(
      (body) => {
        if (!cancelled) setSaved({ projectId, list: body.fillings });
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const replace = useCallback(
    (forProjectId: string | undefined, list: Filling[]) => {
      setSaved({ projectId: forProjectId, list });
    },
    [],
  );

  /** Saves this form's values for the project; a form with nothing filled is not saved. */
  const persist = useCallback(
    (current: FieldValues) => {
      if (!project || !template) return;
      const values = Object.fromEntries(
        Object.entries(current).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(values).length === 0) return;
      const templateId = template.id;
      saveFilling(project.id, templateId, current).then(
        () =>
          setSaved((previous) => ({
            projectId: project.id,
            list: [
              {
                template_id: templateId,
                values,
                updated_at: new Date().toISOString(),
              },
              ...(previous.projectId === project.id
                ? previous.list
                : []
              ).filter((filling) => filling.template_id !== templateId),
            ],
          })),
        (cause) => setNotice(errorMessage(cause)),
      );
    },
    [project, template, setNotice],
  );

  return {
    fillings: saved.projectId === projectId ? saved.list : [],
    replace,
    persist,
  };
}
