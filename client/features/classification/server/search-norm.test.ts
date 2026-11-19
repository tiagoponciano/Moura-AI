import { describe, expect, it } from "vitest";
import { searchNorm } from "./search-norm";

describe("searchNorm, over the extracted norm text", () => {
  it("finds the extinguisher instruction for a question about extinguishers", async () => {
    const { hits } = await searchNorm("extintores distancia maxima percorrer");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.doc === "IN-6")).toBe(true);
    for (const hit of hits) {
      expect(hit.article).toBeGreaterThan(0);
      expect(hit.page).toBeGreaterThan(0);
    }
  });

  it("searches only the instruction named, however it is written", async () => {
    for (const doc of ["IN 7", "in-7", "IN7"]) {
      const { hits } = await searchNorm("hidrante mangueira", doc);
      expect(hits.length).toBeGreaterThan(0);
      expect(new Set(hits.map((hit) => hit.doc))).toEqual(new Set(["IN-7"]));
    }
  });

  it("says when no instruction has that name", async () => {
    const { hits, note } = await searchNorm("extintor", "IN 99");
    expect(hits).toEqual([]);
    expect(note).toContain("No instruction named IN 99");
  });

  it("says when nothing matches, with no invented hit", async () => {
    const { hits, note } = await searchNorm("helicoptero submarino zeppelin");
    expect(hits).toEqual([]);
    expect(note).toBe("No article matches those words.");
  });
});
