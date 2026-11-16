import { requestJson } from "@/lib/api/request-json";
import type { ClassificationState } from "./classification-state";

/** The saved classification of a project, or `null` when it has none. */
export const fetchProjectState = (projectId: string) =>
  requestJson<{ state: ClassificationState | null; updated_at: string | null }>(
    `/api/classification/projects/${projectId}`,
  );

/** Replaces the saved classification inputs of a project. */
export const saveProjectState = (
  projectId: string,
  state: ClassificationState,
) =>
  requestJson<void>(`/api/classification/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
