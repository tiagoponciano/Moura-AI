"use client";

import { useCallback, useMemo, useState } from "react";
import { recordSources, type FieldSources } from "@/lib/field-sources";
import {
  countAnswers,
  pickBuildingAnswers,
  RECORD_BUILDING_TOOL,
  type Building,
} from "../lib/building";
import { evaluateBuilding, groupRequirements } from "../lib/evaluate";
import { PROVISIONAL_RULES } from "../lib/rules";

/** Building answers (from the chat or typed) and the requirements they imply. */
export function useClassification() {
  const [building, setBuilding] = useState<Building>({});
  const [sources, setSources] = useState<FieldSources>({});

  const requirements = useMemo(
    () => evaluateBuilding(PROVISIONAL_RULES, building),
    [building],
  );
  const groups = useMemo(() => groupRequirements(requirements), [requirements]);

  const handleToolResult = useCallback((toolName: string, output: unknown) => {
    if (toolName !== RECORD_BUILDING_TOOL) return;
    const answers = pickBuildingAnswers(output);
    if (Object.keys(answers).length === 0) return;
    setBuilding((current) => ({ ...current, ...answers }));
    setSources((current) =>
      recordSources(current, Object.keys(answers), "assistant"),
    );
  }, []);

  function updateAnswer<K extends keyof Building>(
    field: K,
    value: Building[K] | undefined,
  ) {
    setBuilding((current) => ({ ...current, [field]: value }));
    setSources((current) => recordSources(current, [field], "user"));
  }

  function reset() {
    setBuilding({});
    setSources({});
  }

  return {
    building,
    sources,
    answered: countAnswers(building),
    requirements,
    groups,
    handleToolResult,
    updateAnswer,
    reset,
  };
}
