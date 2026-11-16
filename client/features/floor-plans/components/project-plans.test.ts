import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProjectFloorPlan } from "../lib/project-floor-plans";
import { ProjectPlans } from "./project-plans";

const plan: ProjectFloorPlan = {
  id: "a",
  file_name: "terreo.pdf",
  mode: "vector",
  scale: 100,
  format: "dwg",
  created_at: "2026-11-16T12:00:00Z",
};
const render = (props: Partial<Parameters<typeof ProjectPlans>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(ProjectPlans, {
      hasProject: true,
      plans: [],
      loading: false,
      ...props,
    }),
  );

describe("ProjectPlans", () => {
  it("shows nothing without a project", () => {
    expect(render({ hasProject: false })).toBe("");
  });

  it("says when the project has no conversion yet", () => {
    expect(render()).toContain("Nenhuma planta convertida");
  });

  it("says it is loading", () => {
    expect(render({ loading: true })).toContain("Carregando");
  });

  it("lists each conversion with its format, mode, scale and date", () => {
    const html = render({ plans: [plan] });
    expect(html).toContain("terreo.pdf");
    expect(html).toContain("DWG");
    expect(html).toContain("vetorial");
    expect(html).toContain("1:100");
    expect(html).toContain("16/11/2026");
  });

  it("leaves the scale out of a conversion that had none", () => {
    const html = render({ plans: [{ ...plan, scale: null, mode: "raster" }] });
    expect(html).toContain("imagem");
    expect(html).not.toContain("1:");
  });

  it("warns, as an alert, when the list cannot be used", () => {
    const html = render({ error: "relation missing" });
    expect(html).toContain('role="alert"');
    expect(html).toContain("relation missing");
    expect(html).not.toContain("Nenhuma planta convertida");
  });
});
