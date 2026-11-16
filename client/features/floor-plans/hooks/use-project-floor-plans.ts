"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  fetchProjectFloorPlans,
  recordProjectFloorPlan,
  type ConversionRecord,
  type ProjectFloorPlan,
} from "../lib/project-floor-plans";

/**
 * The conversions kept for the chosen project, and keeping a new one. The list
 * belongs to one project: another project reads as loading until its own answer
 * lands, and a late answer for the previous one is ignored.
 */
export function useProjectFloorPlans(projectId: string | undefined) {
  const [loaded, setLoaded] = useState<{
    projectId: string;
    plans: ProjectFloorPlan[];
    error?: string;
  }>();

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetchProjectFloorPlans(projectId).then(
      (body) => {
        if (!cancelled) setLoaded({ projectId, plans: body.plans });
      },
      (cause) => {
        if (!cancelled) {
          setLoaded({ projectId, plans: [], error: errorMessage(cause) });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  /** Keeps a conversion for the project and puts it first; a failure shows in `error`. */
  const record = useCallback(
    async (record: ConversionRecord) => {
      if (!projectId) return;
      try {
        const { plan } = await recordProjectFloorPlan(projectId, record);
        setLoaded((current) =>
          current?.projectId === projectId
            ? { ...current, plans: [plan, ...current.plans], error: undefined }
            : current,
        );
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
    plans: own?.plans ?? [],
    loading: projectId !== undefined && own === undefined,
    error: own?.error,
    record,
  };
}
