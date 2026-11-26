import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/projects/project";
import { filterProjects, projectDetails } from "./filter-projects";

const project = (name: string): Project => ({ id: name, name, data: {} });
const all = [
  project("Edifício Aurora"),
  project("Residencial Aurora Boreal"),
  project("Galpão Norte"),
];
const names = (projects: Project[]) => projects.map((p) => p.name);

describe("filterProjects", () => {
  it("keeps every project for an empty or blank query", () => {
    expect(filterProjects(all, "")).toEqual(all);
    expect(filterProjects(all, "   ")).toEqual(all);
  });

  it("ignores case and accents", () => {
    expect(names(filterProjects(all, "EDIFICIO"))).toEqual(["Edifício Aurora"]);
    expect(names(filterProjects(all, "galpao"))).toEqual(["Galpão Norte"]);
  });

  it("requires every word, in any order", () => {
    expect(names(filterProjects(all, "boreal aurora"))).toEqual([
      "Residencial Aurora Boreal",
    ]);
    expect(filterProjects(all, "aurora norte")).toEqual([]);
  });

  it("keeps the order of the list", () => {
    expect(names(filterProjects(all, "aurora"))).toEqual([
      "Edifício Aurora",
      "Residencial Aurora Boreal",
    ]);
  });
});

describe("projectDetails", () => {
  it("joins the city, the occupancy and the client that the project has", () => {
    expect(
      projectDetails({
        id: "1",
        name: "Obra",
        data: {
          property_city: "Joinville",
          owner_name: "Padaria Silva",
        },
      }),
    ).toBe("Joinville · Padaria Silva");
  });

  it("is empty for a project with none of them", () => {
    expect(projectDetails(project("Obra"))).toBe("");
  });
});

describe("filterProjects by what is under the name", () => {
  const withData = (name: string, data: Record<string, string>): Project => ({
    id: name,
    name,
    data,
  });
  const list = [
    withData("Obra 1", { property_city: "Joinville" }),
    withData("Obra 2", { owner_name: "Padaria Silva" }),
    withData("Obra 3", {}),
  ];

  it("finds a project by its city", () => {
    expect(names(filterProjects(list, "joinville"))).toEqual(["Obra 1"]);
  });

  it("finds a project by its client, ignoring accents and case", () => {
    expect(names(filterProjects(list, "PADARIA"))).toEqual(["Obra 2"]);
  });

  it("combines a word of the name with one of the city", () => {
    expect(names(filterProjects(list, "obra joinville"))).toEqual(["Obra 1"]);
  });
});
