import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { proposalValues } from "./proposal";
import { fillPptx, pptxTags } from "./render-pptx";

const DRAWING = "http://schemas.openxmlformats.org/drawingml/2006/main";
const TEMPLATE = new Uint8Array(
  readFileSync(join(process.cwd(), "public/templates/proposal/proposal.pptx")),
);

const values = proposalValues(
  { name: "Obra 7", data: { owner_name: "Padaria Silva" } },
  {
    planId: "complete-management",
    price: 1500,
    validityDays: 10,
    format: "pptx",
  },
  new Date("2026-11-11T15:00:00Z"),
);

/** The text of every paragraph of the deck, run by run joined. */
function texts(file: Uint8Array): string[] {
  const zip = new PizZip(file);
  return Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .flatMap((path) => {
      const document = new DOMParser().parseFromString(
        zip.file(path)!.asText(),
        "text/xml",
      );
      const paragraphs = document.getElementsByTagNameNS(DRAWING, "p");
      return Array.from({ length: paragraphs.length }, (_, i) => {
        const runs = paragraphs[i].getElementsByTagNameNS(DRAWING, "t");
        return Array.from(
          { length: runs.length },
          (_, j) => runs[j].textContent,
        ).join("");
      });
    });
}

describe("pptxTags", () => {
  it("finds exactly the tags the proposal gives values for", () => {
    expect(pptxTags(TEMPLATE)).toEqual(new Set(Object.keys(values)));
  });
});

describe("fillPptx", () => {
  it("replaces a tag inside a sentence", () => {
    expect(texts(fillPptx(TEMPLATE, values).file)).toContain(
      "Cliente: Padaria Silva",
    );
  });

  it("leaves no tag behind", () => {
    const { file, missing } = fillPptx(TEMPLATE, values);
    expect(texts(file).some((text) => text.includes("{{"))).toBe(false);
    expect(missing).toEqual([]);
  });

  it("turns a list into one paragraph per entry, in order", () => {
    const filled = texts(
      fillPptx(TEMPLATE, {
        ...values,
        plan_items: ["☑ um", "☑ dois", "☑ três"],
      }).file,
    );
    expect(filled.filter((text) => text.startsWith("☑"))).toEqual([
      "☑ um",
      "☑ dois",
      "☑ três",
    ]);
  });

  it("removes the paragraph of an empty list", () => {
    const filled = texts(fillPptx(TEMPLATE, { ...values, notes: [] }).file);
    expect(filled.some((text) => text.includes("Validade"))).toBe(false);
    expect(filled.some((text) => text.includes("notes"))).toBe(false);
  });

  it("lists the four standard exclusions with bullets", () => {
    const filled = texts(fillPptx(TEMPLATE, values).file);
    expect(filled.filter((text) => text.startsWith("• "))).toHaveLength(4);
  });

  it("empties a tag without a value and reports it", () => {
    const { file, missing } = fillPptx(TEMPLATE, { client: "X" });
    expect(missing).toContain("price");
    expect(texts(file).some((text) => text.includes("{{"))).toBe(false);
  });

  it("keeps every other part of the deck", () => {
    const before = Object.keys(new PizZip(TEMPLATE).files).sort();
    const after = Object.keys(
      new PizZip(fillPptx(TEMPLATE, values).file).files,
    ).sort();
    expect(after).toEqual(before);
  });
});
