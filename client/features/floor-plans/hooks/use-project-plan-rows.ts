"use client";

import { useMemo } from "react";
import { useProjectFiles } from "@/hooks/use-project-files";
import { projectPlanRows } from "../lib/project-plan-rows";
import { useProjectFloorPlans } from "./use-project-floor-plans";

/** The conversions of a project with the plan and the converted file each one left. */
export function useProjectPlanRows(projectId: string) {
  const plans = useProjectFloorPlans(projectId);
  const files = useProjectFiles(projectId);
  const rows = useMemo(
    () => projectPlanRows(plans.plans, files.files),
    [plans.plans, files.files],
  );

  return {
    rows,
    loading: plans.loading || files.loading,
    error: plans.error ?? files.error,
    download: files.download,
  };
}
