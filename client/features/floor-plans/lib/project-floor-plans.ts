import { z } from "zod";
import { requestJson } from "@/lib/api/request-json";

/** Body of `POST /api/floor-plans/projects/:id`: what the conversion that just ran produced. */
export const conversionRecordBody = z.strictObject({
  fileName: z.string().trim().min(1).max(255),
  mode: z.enum(["vector", "raster"]),
  scale: z.number().int().min(1).max(5000).optional(),
  format: z.enum(["dxf", "dwg"]),
});

export type ConversionRecord = z.infer<typeof conversionRecordBody>;

/** One conversion kept for a project. */
export type ProjectFloorPlan = {
  id: string;
  file_name: string;
  mode: "vector" | "raster";
  scale: number | null;
  format: "dxf" | "dwg";
  created_at: string;
};

export const fetchProjectFloorPlans = (projectId: string) =>
  requestJson<{ plans: ProjectFloorPlan[] }>(
    `/api/floor-plans/projects/${projectId}`,
  );

export const recordProjectFloorPlan = (
  projectId: string,
  record: ConversionRecord,
) =>
  requestJson<{ plan: ProjectFloorPlan }>(
    `/api/floor-plans/projects/${projectId}`,
    { method: "POST", body: JSON.stringify(record) },
  );
