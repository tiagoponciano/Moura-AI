import { describe, expect, it } from "vitest";
import type { ProjectFile } from "@/lib/projects/files";
import type { ProjectFloorPlan } from "./project-floor-plans";
import { projectPlanRows } from "./project-plan-rows";

const plan = (
  id: string,
  fileName: string,
  format: "dxf" | "dwg",
  createdAt: string,
): ProjectFloorPlan => ({
  id,
  file_name: fileName,
  mode: "vector",
  scale: 100,
  format,
  created_at: createdAt,
});

const file = (
  id: string,
  kind: ProjectFile["kind"],
  fileName: string,
  createdAt: string,
): ProjectFile => ({
  id,
  kind,
  file_name: fileName,
  mime_type: "application/octet-stream",
  size_bytes: 10,
  storage_path: `project/${id}-${fileName}`,
  created_at: createdAt,
});

describe("projectPlanRows", () => {
  it("gives a conversion the plan uploaded under the same name", () => {
    const rows = projectPlanRows(
      [plan("p1", "terreo.pdf", "dwg", "2026-11-19T10:00:00Z")],
      [file("f1", "plan", "terreo.pdf", "2026-11-19T10:00:03Z")],
    );

    expect(rows[0].original?.id).toBe("f1");
  });

  it("gives a conversion the converted file of its format kept close to it", () => {
    const rows = projectPlanRows(
      [plan("p1", "terreo.pdf", "dwg", "2026-11-19T10:00:00Z")],
      [
        file("f1", "conversion", "planta.dxf", "2026-11-19T10:00:02Z"),
        file("f2", "conversion", "planta.dwg", "2026-11-19T10:00:02Z"),
      ],
    );

    expect(rows[0].converted?.id).toBe("f2");
  });

  it("does not give a converted file kept long after the conversion", () => {
    const rows = projectPlanRows(
      [plan("p1", "terreo.pdf", "dwg", "2026-11-19T10:00:00Z")],
      [file("f1", "conversion", "planta.dwg", "2026-11-19T11:00:00Z")],
    );

    expect(rows[0].converted).toBeUndefined();
  });

  it("gives each converted file to one conversion only, the nearest", () => {
    const rows = projectPlanRows(
      [
        plan("p2", "terreo.pdf", "dwg", "2026-11-19T10:02:00Z"),
        plan("p1", "terreo.pdf", "dwg", "2026-11-19T10:00:00Z"),
      ],
      [
        file("f2", "conversion", "planta.dwg", "2026-11-19T10:02:01Z"),
        file("f1", "conversion", "planta.dwg", "2026-11-19T10:00:01Z"),
      ],
    );

    expect(rows.map((row) => row.converted?.id)).toEqual(["f2", "f1"]);
  });

  it("keeps a conversion with no files kept", () => {
    const rows = projectPlanRows(
      [plan("p1", "terreo.pdf", "dxf", "2026-11-19T10:00:00Z")],
      [],
    );

    expect(rows).toEqual([
      {
        plan: plan("p1", "terreo.pdf", "dxf", "2026-11-19T10:00:00Z"),
        original: undefined,
        converted: undefined,
      },
    ]);
  });
});
