"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  summarizeClassification,
  type ClassificationSummary,
} from "../lib/classification-summary";
import { fetchProjectState } from "../lib/project-state-api";
import { analysisDate } from "../lib/today";

type Loaded = {
  projectId: string;
  summary?: ClassificationSummary;
  updatedAt?: string;
  error?: string;
};

/** The saved classification of a project, summarized; another project reads as loading. */
export function useClassificationSummary(projectId: string) {
  const [loaded, setLoaded] = useState<Loaded>();

  useEffect(() => {
    let cancelled = false;
    fetchProjectState(projectId).then(
      (body) => {
        if (cancelled) return;
        setLoaded({
          projectId,
          summary: summarizeClassification(body.state, analysisDate()),
          updatedAt: body.updated_at ?? undefined,
        });
      },
      (cause) => {
        if (!cancelled) setLoaded({ projectId, error: errorMessage(cause) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const own = loaded?.projectId === projectId ? loaded : undefined;
  return {
    summary: own?.summary,
    updatedAt: own?.updatedAt,
    error: own?.error,
    loading: own === undefined,
  };
}
