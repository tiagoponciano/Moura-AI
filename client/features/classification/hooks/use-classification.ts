"use client";

import { useCallback, useMemo, useState } from "react";
import { recordSources, type FieldSources } from "@/lib/field-sources";
import { applyAnswers, applyEdit, pickAnswers } from "../lib/answers";
import {
  pickEnlargement,
  type EnlargementAnswers,
} from "../lib/enlargement-input";
import type { Facts } from "../lib/engine/types";
import type { OccupationPart } from "../lib/mixed-occupancy";
import { classifyWithParts, pickParts } from "../lib/mixed-parts";
import {
  RECORD_ANSWERS_TOOL,
  RECORD_ENLARGEMENT_TOOL,
  RECORD_PARTS_TOOL,
} from "../lib/questions";
import { analysisDate } from "../lib/today";

/** The answers (from the chat or typed in the panel) and the classification they give. */
export function useClassification() {
  const [answers, setAnswers] = useState<Facts>({});
  const [parts, setParts] = useState<OccupationPart[]>([]);
  const [enlargement, setEnlargement] = useState<EnlargementAnswers>();
  const [sources, setSources] = useState<FieldSources>({});
  const [date] = useState(() => analysisDate());

  const classification = useMemo(
    () => classifyWithParts(answers, parts, date),
    [answers, parts, date],
  );

  const handleToolResult = useCallback((toolName: string, output: unknown) => {
    if (toolName === RECORD_ENLARGEMENT_TOOL) {
      // The tool sends every field, so a replayed chat ends with the same record.
      setEnlargement(
        pickEnlargement(
          (output as { enlargement?: unknown } | null)?.enlargement,
        ),
      );
      return;
    }
    if (toolName === RECORD_PARTS_TOOL) {
      // The tool sends the whole list, so a replayed chat ends with the same one.
      setParts(pickParts((output as { parts?: unknown } | null)?.parts));
      return;
    }
    if (toolName !== RECORD_ANSWERS_TOOL) return;
    const picked = pickAnswers(output);
    const touched = [...Object.keys(picked.values), ...picked.unknown];
    if (touched.length === 0) return;
    setAnswers((current) => applyAnswers(current, picked));
    setSources((current) => recordSources(current, touched, "assistant"));
  }, []);

  /** A value typed in the panel; `null` is "não sei" and `undefined` clears the answer. */
  function updateAnswer(fact: string, value: unknown) {
    setAnswers((current) => applyEdit(current, fact, value));
    setSources((current) => recordSources(current, [fact], "user"));
  }

  function reset() {
    setAnswers({});
    setParts([]);
    setEnlargement(undefined);
    setSources({});
  }

  return {
    answers,
    parts,
    enlargement,
    sources,
    classification,
    handleToolResult,
    updateAnswer,
    reset,
  };
}
