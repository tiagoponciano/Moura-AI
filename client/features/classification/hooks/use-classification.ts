"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { recordSources, type FieldSources } from "@/lib/field-sources";
import { applyPanelEdit, applyToolResult } from "../lib/apply-tool-result";
import {
  EMPTY_STATE,
  type ClassificationState,
} from "../lib/classification-state";
import { classifyWithParts } from "../lib/mixed-parts";
import { analysisDate } from "../lib/today";

/**
 * The inputs of a classification (from the chat or typed in the panel) and the
 * result they give. `onPersist` hears every change made here, with the whole new
 * state; `restore` replaces the state without calling it, for what was loaded.
 */
export function useClassification(
  onPersist?: (state: ClassificationState) => void,
) {
  const [state, setState] = useState<ClassificationState>(EMPTY_STATE);
  const [sources, setSources] = useState<FieldSources>({});
  const [date] = useState(() => analysisDate());
  /** The latest state, so two results in a row each build on the one before. */
  const latest = useRef<ClassificationState>(EMPTY_STATE);
  const persist = useRef(onPersist);
  useEffect(() => {
    persist.current = onPersist;
  }, [onPersist]);

  const classification = useMemo(
    () => classifyWithParts(state.facts, state.parts, date),
    [state.facts, state.parts, date],
  );

  const commit = useCallback((next: ClassificationState, save: boolean) => {
    latest.current = next;
    setState(next);
    if (save) persist.current?.(next);
  }, []);

  const handleToolResult = useCallback(
    (toolName: string, output: unknown) => {
      const change = applyToolResult(latest.current, toolName, output);
      if (!change) return;
      commit(change.next, true);
      if (change.touched.length > 0) {
        setSources((current) =>
          recordSources(current, change.touched, "assistant"),
        );
      }
    },
    [commit],
  );

  const updateAnswer = useCallback(
    (fact: string, value: unknown) => {
      commit(applyPanelEdit(latest.current, fact, value), true);
      setSources((current) => recordSources(current, [fact], "user"));
    },
    [commit],
  );

  const reset = useCallback(() => {
    commit(EMPTY_STATE, true);
    setSources({});
  }, [commit]);

  /** Replaces everything with what was loaded for a project; nothing is saved back. */
  const restore = useCallback(
    (loaded: ClassificationState) => {
      commit(loaded, false);
      setSources(recordSources({}, Object.keys(loaded.facts), "project"));
    },
    [commit],
  );

  return {
    answers: state.facts,
    parts: state.parts,
    enlargement: state.enlargement,
    faults: state.faults,
    sources,
    classification,
    handleToolResult,
    updateAnswer,
    reset,
    restore,
  };
}
