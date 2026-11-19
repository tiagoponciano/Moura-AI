import type { ProjectFile } from "@/lib/projects/files";
import type { ProjectFloorPlan } from "./project-floor-plans";

/** A converted file is kept right after its conversion is recorded, in either order. */
const MATCH_WINDOW_MS = 5 * 60 * 1000;

export type ProjectPlanRow = {
  plan: ProjectFloorPlan;
  /** The plan that was uploaded, kept under its own name. */
  original?: ProjectFile;
  /** The DXF or DWG the conversion produced. */
  converted?: ProjectFile;
};

const time = (iso: string) => new Date(iso).getTime();

/**
 * The conversions of a project with the files they left. The plan is the latest
 * `plan` file with the conversion's file name. The converted file is always named
 * `planta.<format>`, so it is the nearest one of that format kept within five
 * minutes of the conversion, and each is given to one conversion only.
 */
export function projectPlanRows(
  plans: ProjectFloorPlan[],
  files: ProjectFile[],
): ProjectPlanRow[] {
  const taken = new Set<string>();
  return plans.map((plan) => {
    const original = files
      .filter(
        (file) => file.kind === "plan" && file.file_name === plan.file_name,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const distance = (file: ProjectFile) =>
      Math.abs(time(file.created_at) - time(plan.created_at));
    const converted = files
      .filter(
        (file) =>
          file.kind === "conversion" &&
          file.file_name === `planta.${plan.format}` &&
          !taken.has(file.id) &&
          distance(file) <= MATCH_WINDOW_MS,
      )
      .sort((a, b) => distance(a) - distance(b))[0];
    if (converted) taken.add(converted.id);
    return { plan, original, converted };
  });
}
