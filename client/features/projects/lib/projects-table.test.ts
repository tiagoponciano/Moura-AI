import { describe, expect, it } from "vitest";
import type { Project } from "@/lib/projects/project";
import {
  matchesProjectQuery,
  parseArea,
  toProjectRows,
} from "./projects-table";

const project = (name: string, data: Record<string, string> = {}): Project => ({
  id: name,
  name,
  data,
});

describe("parseArea", () => {
  it("reads plain and pt-BR numbers", () => {
    expect(parseArea("820")).toBe(820);
    expect(parseArea("1.250,5")).toBe(1250.5);
    expect(parseArea("82,5")).toBe(82.5);
  });

  it("gives undefined for a blank or for text that is not a number", () => {
    expect(parseArea(undefined)).toBeUndefined();
    expect(parseArea("")).toBeUndefined();
    expect(parseArea("cerca de 80")).toBeUndefined();
  });
});

describe("toProjectRows", () => {
  it("carries the city, the occupation and the area as a number", () => {
    const [row] = toProjectRows([
      project("Loja Centro", {
        property_city: "Joinville",
        property_occupancy: "A-2",
        block_area: "820",
      }),
    ]);
    expect(row).toMatchObject({
      city: "Joinville",
      occupancy: "A-2",
      area: 820,
    });
  });
});

describe("matchesProjectQuery", () => {
  const [row] = toProjectRows([
    project("Galpão Itajaí", { property_city: "Itajaí" }),
  ]);

  it("matches every word across the name and the city, ignoring accents and case", () => {
    expect(matchesProjectQuery(row, "galpao ITAJAI")).toBe(true);
    expect(matchesProjectQuery(row, "")).toBe(true);
  });

  it("does not match when a word is nowhere", () => {
    expect(matchesProjectQuery(row, "galpao blumenau")).toBe(false);
  });

  it("finds a project by its city when the name does not say it", () => {
    const [other] = toProjectRows([
      project("Loja 12", { property_city: "Blumenau" }),
    ]);
    expect(matchesProjectQuery(other, "blumenau")).toBe(true);
  });
});
