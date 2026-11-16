import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Section = {
  intro: string;
  items: { text: string; group?: string }[];
  applicable: boolean;
};
type System = {
  title: string;
  norm: string;
  page: number;
  sections: {
    adaptations: Section;
    compensations: Section;
    exemptions: Section;
    substitutions: Section;
  };
};
type AnnexC = { systems: System[]; checks: { needs_human_look: string[] } };
type Manifest = {
  pdf_sha256: string;
  annex_c: { systems: number; sha256: string; needs_human_look: number };
};

const read = <T>(file: string): T =>
  JSON.parse(readFileSync(join(__dirname, file), "utf-8")) as T;

function canonical(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([k, val]) => [k, sort(val)]),
          )
        : v;
  return JSON.stringify(sort(value));
}

const annex = read<AnnexC & Record<string, unknown>>("annex-c.json");
const manifest = read<Manifest>("manifest.json");
const system = (norm: string) => annex.systems.find((s) => s.norm === norm)!;

describe("IN 5 Annex C, as extracted", () => {
  it("matches the manifest hash and records the PDF hash, not the PDF", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_c.sha256);
    expect(annex.systems).toHaveLength(manifest.annex_c.systems);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("has the six systems of the annex, in the printed order", () => {
    expect(annex.systems.map((s) => s.norm)).toEqual([
      "IN 7",
      "IN 9",
      "IN 12",
      "IN 19",
      "IN 8",
      "IN 14",
    ]);
  });

  it("flags nothing a person still has to look at", () => {
    expect(annex.checks.needs_human_look).toEqual([]);
    expect(manifest.annex_c.needs_human_look).toBe(0);
  });

  it("keeps the lettered adaptations of the hydraulic system, from a to i", () => {
    const items = system("IN 7").sections.adaptations.items;
    expect(items).toHaveLength(9);
    expect(items.map((i) => i.text.slice(0, 2))).toEqual(
      "abcdefghi".split("").map((letter) => `${letter}.`),
    );
  });

  it("joins the exits table across its two pages without repeating an item", () => {
    const items = system("IN 9").sections.adaptations.items;
    const lettersInstalled = items
      .filter((i) => i.group === "I - Quando já instalado")
      .map((i) => i.text.slice(0, 2));
    expect(lettersInstalled).toEqual(
      "abcdefghij".split("").map((letter) => `${letter}.`),
    );
    expect(
      items.filter((i) => i.group === "II - Quando a instalar"),
    ).toHaveLength(1);
  });

  it("reads 'não aplicável' as a section that does not apply", () => {
    expect(system("IN 9").sections.exemptions.applicable).toBe(false);
    expect(system("IN 12").sections.substitutions.applicable).toBe(false);
    expect(system("IN 8").sections.compensations.applicable).toBe(false);
    expect(system("IN 7").sections.exemptions.applicable).toBe(true);
  });

  it("keeps the horizontal compartmentation adaptations under their own group, and the vertical one as not applicable", () => {
    const items = system("IN 14").sections.adaptations.items;
    expect(items.map((i) => i.group)).toEqual([
      "Compartimentação Horizontal",
      "Compartimentação Horizontal",
      "Compartimentação Horizontal",
      "Compartimentação Vertical",
    ]);
    expect(items[3].text).toBe("Não aplicável.");
  });

  it("keeps the dates of the electrical installations, as printed", () => {
    expect(system("IN 19").sections.exemptions.items[0].text).toContain(
      "17/02/2020",
    );
  });
});
