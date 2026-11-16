import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/projects/project";
import { filterProjects } from "./filter-projects";

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
