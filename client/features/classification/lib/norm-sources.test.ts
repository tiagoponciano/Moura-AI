import { describe, expect, it } from "vitest";
import { listNormSources, summarizeManifest } from "./norm-sources";

describe("summarizeManifest", () => {
  it("adds the items to check of every annex", () => {
    const source = summarizeManifest({
      doc: "IN-9",
      source_url: "https://drive.google.com/file/d/x/view",
      retrieved: "2026-11-19",
      pdf_pages: 3,
      annex_a: { needs_human_look: 2 },
      annex_b: { needs_human_look: 1 },
    });
    expect(source).toEqual({
      doc: "IN-9",
      sourceUrl: "https://drive.google.com/file/d/x/view",
      retrieved: "2026-11-19",
      pages: 3,
      needsHumanLook: 3,
    });
  });

  it("adds the items to check of every table in a list", () => {
    const source = summarizeManifest({
      doc: "IN-9",
      source_url: "",
      retrieved: "2026-11-19",
      pdf_pages: 1,
      tables: [{ needs_human_look: 1 }, { needs_human_look: 0 }, {}],
    });
    expect(source.needsHumanLook).toBe(1);
  });
});

describe("listNormSources", () => {
  it("lists the four norms, each with a Drive link", () => {
    const sources = listNormSources();
    expect(sources.map((s) => s.doc)).toEqual([
      "IN-1-P1",
      "IN-1-P2",
      "IN-3",
      "IN-5",
    ]);
    for (const source of sources) {
      expect(source.sourceUrl).toContain("drive.google.com/file/d/");
      expect(source.pages).toBeGreaterThan(0);
    }
  });
});
