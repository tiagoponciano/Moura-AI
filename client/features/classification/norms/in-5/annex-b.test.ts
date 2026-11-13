import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Mark = { id: string; notes: number[] };
type Row = {
  page: number;
  divisions: string[];
  vital: Mark[];
  indispensable: Mark[];
  adaptable: Mark[];
};
type AnnexB = {
  legend: Record<string, string>;
  notes: { number: number; text: string }[];
  rows: Row[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  pdf_sha256: string;
  annex_b: { rows: number; sha256: string; needs_human_look: number };
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

const annex = read<AnnexB>("annex-b.json");
const manifest = read<Manifest>("manifest.json");
const row = (division: string) =>
  annex.rows.find((r) => r.divisions.includes(division))!;
const ids = (marks: Mark[]) => marks.map((m) => m.id);

describe("IN 5 Annex B, as extracted", () => {
  it("matches the manifest hash and row count, and records the PDF hash, not the PDF", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_b.sha256);
    expect(annex.rows).toHaveLength(manifest.annex_b.rows);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("lists every division from A-1 to M-11 exactly once", () => {
    const all = annex.rows.flatMap((r) => r.divisions);
    expect(new Set(all).size).toBe(all.length);
    for (const d of ["A-1", "C-2", "F-11", "K-2", "L-3", "M-1", "M-11"])
      expect(all).toContain(d);
  });

  it("keeps the printed lists of a few rows, checked against the PDF", () => {
    expect(ids(row("C-2").vital)).toEqual(["SPE", "IE", "SAL"]);
    expect(ids(row("C-2").indispensable)).toEqual(["PE", "SA", "Comp"]);
    expect(ids(row("A-1").indispensable)).toEqual(["AVtr"]);
    expect(ids(row("L-3").vital)).toEqual(["TODOS"]);
    expect(row("M-2").vital[1]).toEqual({ id: "PE", notes: [3] });
    expect(row("K-2").indispensable.at(-1)).toEqual({ id: "SHP", notes: [2] });
  });

  it("cites only notes that are printed", () => {
    const printed = annex.notes.map((n) => n.number);
    for (const r of annex.rows)
      for (const m of [...r.vital, ...r.indispensable])
        for (const n of m.notes) expect(printed).toContain(n);
  });

  it("flags only the brigade abbreviation missing from the printed legend", () => {
    expect(annex.checks.needs_human_look).toHaveLength(
      manifest.annex_b.needs_human_look,
    );
    expect(
      annex.checks.needs_human_look.every((x) =>
        x.endsWith("BI is not in the legend"),
      ),
    ).toBe(true);
  });
});
