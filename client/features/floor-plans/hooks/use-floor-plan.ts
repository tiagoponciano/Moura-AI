"use client";

import { useEffect, useState } from "react";
import {
  FLOOR_PLAN_PROBLEM_MESSAGE,
  checkFloorPlanFile,
} from "../lib/floor-plan-file";

export type SelectedFloorPlan = { name: string; url: string };

/** The PDF chosen for conversion, kept in the browser until the converter exists. */
export function useFloorPlan() {
  const [plan, setPlan] = useState<SelectedFloorPlan>();
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    if (!plan) return;
    return () => URL.revokeObjectURL(plan.url);
  }, [plan]);

  function select(file: File) {
    const fileProblem = checkFloorPlanFile({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (fileProblem) {
      setProblem(FLOOR_PLAN_PROBLEM_MESSAGE[fileProblem]);
      return;
    }
    setProblem(undefined);
    setPlan({ name: file.name, url: URL.createObjectURL(file) });
  }

  function clear() {
    setPlan(undefined);
    setProblem(undefined);
  }

  return { plan, problem, select, clear };
}
