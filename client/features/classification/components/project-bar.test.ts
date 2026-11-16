import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ProjectSaveStatus } from "../hooks/use-project-classification";
import { ProjectBar } from "./project-bar";

const projects = [{ id: "p1", name: "Edifício Aurora", data: {} }];
const render = (status: ProjectSaveStatus, selectedId?: string) =>
  renderToStaticMarkup(
    createElement(ProjectBar, {
      projects,
      selectedId,
      onSelect: () => {},
      status,
    }),
  );

describe("ProjectBar", () => {
  it("names the selected project and says changes are saved to it", () => {
    const html = render({ kind: "ready" }, "p1");
    expect(html).toContain("Edifício Aurora");
    expect(html).toContain("salvas no projeto");
  });

  it("says nothing is saved without a project", () => {
    const html = render({ kind: "none" });
    expect(html).toContain("Escolher projeto");
    expect(html).toContain("nada é salvo");
  });

  it("says when it is loading, saving and saved", () => {
    expect(render({ kind: "loading" }, "p1")).toContain("Carregando");
    expect(render({ kind: "saving" }, "p1")).toContain("Salvando");
    expect(render({ kind: "saved" }, "p1")).toContain("Salvo no projeto");
  });

  it("warns, as an alert, that the panel keeps working unsaved when the saved state is not available", () => {
    const html = render({ kind: "unavailable", message: "x" }, "p1");
    expect(html).toContain('role="alert"');
    expect(html).toContain("segue sem salvar");
  });

  it("offers no project when there are none", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectBar, {
        projects: [],
        onSelect: () => {},
        status: { kind: "none" },
      }),
    );
    expect(html).toContain("Nenhum projeto");
    expect(html).toContain("disabled");
  });
});
