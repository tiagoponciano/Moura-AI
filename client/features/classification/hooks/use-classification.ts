"use client";

import { useCallback, useMemo, useState } from "react";
import {
  pickBuildingAnswers,
  RECORD_BUILDING_TOOL,
  type Building,
} from "../lib/building";
import { evaluateBuilding } from "../lib/evaluate";
import { PROVISIONAL_RULES } from "../lib/rules";

/** Building answers (from the chat or typed) and the requirements they imply. */
export function useClassification() {
  const [building, setBuilding] = useState<Building>({});

  const requirements = useMemo(
    () => evaluateBuilding(PROVISIONAL_RULES, building),
    [building],
  );

  const handleToolResult = useCallback((toolName: string, output: unknown) => {
    if (toolName !== RECORD_BUILDING_TOOL) return;
    const answers = pickBuildingAnswers(output);
    if (Object.keys(answers).length === 0) return;
    setBuilding((current) => ({ ...current, ...answers }));
  }, []);

  function updateAnswer<K extends keyof Building>(
    field: K,
    value: Building[K] | undefined,
  ) {
    setBuilding((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setBuilding({});
  }

  return { building, requirements, handleToolResult, updateAnswer, reset };
}
