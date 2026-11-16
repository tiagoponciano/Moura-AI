"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import {
  EMPTY_STATE,
  pickState,
  type ClassificationState,
} from "../lib/classification-state";
import { fetchProjectState, saveProjectState } from "../lib/project-state-api";

/** A save waits this long after the last change, so typing saves once. */
const SAVE_DELAY_MS = 800;

export type ProjectSaveStatus =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "unavailable"; message: string };

/**
 * Loads the classification saved for the chosen project and saves each change made
 * after that. A change is saved from `persist`, called by the mutations themselves,
 * never from an effect watching the state: that would save the empty state before
 * the load lands. A pending save goes out at once when the project changes, so it
 * is never lost or sent to the wrong project. Without a project nothing is saved,
 * and when the project's state cannot be read nothing is either.
 */
export function useProjectClassification(
  projectId: string | undefined,
  restore: (state: ClassificationState) => void,
) {
  /** The last status seen, with the project it is about; another project reads as loading. */
  const [seen, setSeen] = useState<{
    projectId?: string;
    status: ProjectSaveStatus;
  }>({ status: { kind: "none" } });
  const setStatus = useCallback(
    (status: ProjectSaveStatus, forProject: string | undefined) =>
      setSeen({ projectId: forProject, status }),
    [],
  );
  const status: ProjectSaveStatus =
    seen.projectId === projectId
      ? seen.status
      : projectId
        ? { kind: "loading" }
        : { kind: "none" };
  const pending = useRef<{
    projectId: string;
    state: ClassificationState;
    timer: ReturnType<typeof setTimeout>;
  }>(undefined);
  /** The project the hook is on, and whether its state was loaded and may be saved. */
  const projectRef = useRef<string | undefined>(undefined);
  const readyRef = useRef(false);

  const send = useCallback(
    async (id: string, state: ClassificationState) => {
      if (projectRef.current === id) setStatus({ kind: "saving" }, id);
      try {
        await saveProjectState(id, state);
        if (projectRef.current === id) setStatus({ kind: "saved" }, id);
      } catch (cause) {
        if (projectRef.current === id) {
          readyRef.current = false;
          setStatus({ kind: "unavailable", message: errorMessage(cause) }, id);
        }
      }
    },
    [setStatus],
  );

  const flush = useCallback(() => {
    const waiting = pending.current;
    if (!waiting) return;
    clearTimeout(waiting.timer);
    pending.current = undefined;
    void send(waiting.projectId, waiting.state);
  }, [send]);

  useEffect(() => {
    flush();
    projectRef.current = projectId;
    readyRef.current = false;
    if (!projectId) {
      restore(EMPTY_STATE);
      return;
    }
    let cancelled = false;
    fetchProjectState(projectId).then(
      (body) => {
        if (cancelled) return;
        restore(body.state ? pickState(body.state) : EMPTY_STATE);
        readyRef.current = true;
        setStatus({ kind: "ready" }, projectId);
      },
      (cause) => {
        if (cancelled) return;
        restore(EMPTY_STATE);
        setStatus(
          { kind: "unavailable", message: errorMessage(cause) },
          projectId,
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [projectId, restore, flush, setStatus]);

  // A change not saved yet still goes out if the tab is left.
  useEffect(() => flush, [flush]);

  /** Called with the whole new state after every change; saves it after a pause. */
  const persist = useCallback(
    (state: ClassificationState) => {
      const id = projectRef.current;
      if (!id || !readyRef.current) return;
      if (pending.current) clearTimeout(pending.current.timer);
      pending.current = {
        projectId: id,
        state,
        timer: setTimeout(flush, SAVE_DELAY_MS),
      };
    },
    [flush],
  );

  return { status, persist };
}
