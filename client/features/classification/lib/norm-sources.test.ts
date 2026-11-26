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
  const sources = listNormSources();

  it("lists the 33 instructions of the Drive folder that have articles, in the order of their number, then the guide for engineers", () => {
    expect(sources).toHaveLength(34);
    expect(sources.slice(0, 4).map((s) => s.doc)).toEqual([
      "IN-1-P1",
      "IN-1-P2",
      "IN-2",
      "IN-3",
    ]);
    expect(sources.at(-2)?.doc).toBe("IN-35");
    expect(sources.at(-1)?.doc).toBe("CARTILHA");
  });

  it("gives every one a Drive link and a page count", () => {
    for (const source of sources) {
      expect(source.sourceUrl, source.doc).toContain(
        "drive.google.com/file/d/",
      );
      expect(source.pages, source.doc).toBeGreaterThan(0);
    }
  });

  it("has no instruction twice and none that does not exist", () => {
    const docs = sources.map((s) => s.doc);
    expect(new Set(docs).size).toBe(docs.length);
    for (const missing of ["IN-16", "IN-17", "IN-32"]) {
      expect(docs).not.toContain(missing);
    }
  });
});
