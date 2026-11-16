import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Row = {
  page: number;
  system: string;
  sigla: string;
  fault: string;
  parameter: string;
  measures: string;
};
type AnnexD = {
  rows: Row[];
  notes: { page: number; text: string }[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  pdf_sha256: string;
  annex_d: { rows: number; sha256: string; needs_human_look: number };
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

const annex = read<AnnexD & Record<string, unknown>>("annex-d.json");
const manifest = read<Manifest>("manifest.json");
const rowsOf = (sigla: string) => annex.rows.filter((r) => r.sigla === sigla);

describe("IN 5 Annex D, as extracted", () => {
  it("matches the manifest hash and row count, and records the PDF hash, not the PDF", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_d.sha256);
    expect(annex.rows).toHaveLength(manifest.annex_d.rows);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("flags nothing a person still has to look at", () => {
    expect(annex.checks.needs_human_look).toEqual([]);
  });

  it("has the rows of the four systems, as printed", () => {
    expect(
      ["AVtr", "GCC", "SHP", "SE"].map((sigla) => rowsOf(sigla).length),
    ).toEqual([1, 1, 2, 11]);
  });

  it("repeats the system and the fault on the rows that leave them blank", () => {
    const widths = rowsOf("SE").filter((r) => r.fault.startsWith("Largura"));
    expect(widths.map((r) => r.parameter)).toEqual([
      "L ≤2%",
      "2% < L ≤10%",
      "10% < L ≤20%",
      "20% < L ≤35%",
      "L > 35%",
    ]);
    expect(widths.every((r) => r.system === "Saídas de emergência")).toBe(true);
  });

  it("keeps the rows that the norm does not admit", () => {
    const refused = annex.rows.filter((r) =>
      r.measures.startsWith("Não admitido"),
    );
    expect(refused.map((r) => r.parameter)).toEqual([
      "L > 35%",
      "h ou b > 15%",
    ]);
  });

  it("joins the rows that continue on the next page", () => {
    const pages = annex.rows.map((r) => r.page);
    expect(pages.filter((p) => p === 20)).toHaveLength(6);
    expect(pages.filter((p) => p === 21)).toHaveLength(5);
    expect(pages.filter((p) => p === 22)).toHaveLength(4);
  });

  it("keeps the notes under the table", () => {
    expect(annex.notes).toHaveLength(2);
    expect(annex.notes[0].text).toContain("Controle de fumaça necessário");
  });
});
