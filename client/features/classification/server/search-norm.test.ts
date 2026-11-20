import { describe, expect, it } from "vitest";
import { readNormText, searchNorm } from "./search-norm";

describe("searchNorm, over the extracted norm text", () => {
  it("finds the extinguisher instruction for a question about extinguishers", async () => {
    const { hits } = await searchNorm("extintores distancia maxima percorrer");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((hit) => hit.doc === "IN-6")).toBe(true);
    for (const hit of hits) {
      if (hit.kind === "article") expect(hit.article).toBeGreaterThan(0);
      else expect(hit.article).toBeUndefined();
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

describe("searchNorm, annexes", () => {
  it("finds an annex page when the words are only there, with no article number", async () => {
    // "mangotinho" with the figure captions of IN 7, Annex B.
    const { hits } = await searchNorm(
      "figura mangotinho sistema tipo",
      "IN 7",
      20,
    );
    const annex = hits.find((hit) => hit.kind === "annex");
    expect(annex).toBeDefined();
    expect(annex?.article).toBeUndefined();
    expect(annex?.page).toBeGreaterThan(10);
  });
});

describe("readNormText", () => {
  it("reads a whole article, as printed, with where it is", async () => {
    const reading = await readNormText("IN 7", { article: 10 });
    expect(reading).toMatchObject({
      doc: "IN-7",
      kind: "article",
      article: 10,
    });
    if ("text" in reading) {
      expect(reading.text.startsWith("Art. 10")).toBe(true);
      expect(reading.page).toBeGreaterThan(0);
    }
  });

  it("reads an annex page by its page number", async () => {
    const reading = await readNormText("in-7", { annexPage: 16 });
    expect(reading).toMatchObject({ doc: "IN-7", kind: "annex", page: 16 });
    if ("text" in reading) expect(reading.text.length).toBeGreaterThan(100);
  });

  it("says so for an article or a page that does not exist, and invents nothing", async () => {
    expect(await readNormText("IN 7", { article: 9999 })).toEqual({
      note: "IN-7 has no article 9999.",
    });
    expect(await readNormText("IN 7", { annexPage: 2 })).toEqual({
      note: "IN-7 has no annex on page 2.",
    });
    expect(await readNormText("IN 99", { article: 1 })).toEqual({
      note: "No instruction named IN 99.",
    });
  });

  it("cuts a very long article at the reading limit and says it did (art. 21 of IN 1 parte 2 has over 12,000 characters)", async () => {
    const reading = await readNormText("IN 1 p2", { article: 21 });
    expect(reading).toMatchObject({ truncated: true });
    if ("text" in reading) expect(reading.text.length).toBe(8000);
  });

  it("does not mark a short article as cut", async () => {
    expect(await readNormText("IN 7", { article: 10 })).toMatchObject({
      truncated: false,
    });
  });
});
