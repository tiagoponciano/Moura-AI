import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Row = {
  group: string;
  division: string;
  destination: string;
  qfi_mj_m2: number | null;
  qfi_raw: string;
  page: number;
};
type AnnexA = {
  rows: Row[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  pdf_sha256: string;
  annex_a: { rows: number; sha256: string; needs_human_look: number };
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

const annex = read<AnnexA & Record<string, unknown>>("annex-a.json");
const manifest = read<Manifest>("manifest.json");

describe("IN 3 Annex A, as extracted", () => {
  it("matches the manifest hash and row count, and records the PDF hash, not the PDF", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_a.sha256);
    expect(annex.rows).toHaveLength(manifest.annex_a.rows);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives every row a group, a division inside it and a destination", () => {
    for (const row of annex.rows) {
      expect(row.division, row.destination).toMatch(/^[A-M]-\d{1,2}$/);
      expect(row.division[0]).toBe(row.group);
      expect(row.destination.length).toBeGreaterThan(0);
    }
  });

  it("reads a plain load as a number and keeps the printed text of the others", () => {
    for (const row of annex.rows) {
      if (row.qfi_mj_m2 === null) expect(row.qfi_raw).toMatch(/^Anexo/);
      else expect(String(row.qfi_mj_m2)).toBe(row.qfi_raw.replace(".", ""));
    }
  });

  it("keeps the loads of commerce as printed, checked against the PDF", () => {
    const load = (division: string, destination: string) =>
      annex.rows.find(
        (r) => r.division === division && r.destination === destination,
      )?.qfi_mj_m2;
    expect(load("C-1", "Açougue")).toBe(40);
    expect(load("C-2", "Vestuário e acessórios")).toBe(600);
    expect(load("C-2", "Supermercados (vendas)")).toBe(500);
    expect(load("C-3", "Centro de compras em geral (shoppings)")).toBe(800);
  });

  it("has the number of activities per commercial division printed in the norm", () => {
    const count = (division: string) =>
      annex.rows.filter((r) => r.division === division).length;
    expect([count("C-1"), count("C-2"), count("C-3")]).toEqual([19, 38, 1]);
  });

  it("flags only what a person still has to look at", () => {
    expect(annex.checks.needs_human_look).toHaveLength(
      manifest.annex_a.needs_human_look,
    );
    expect(annex.checks.needs_human_look).toEqual([
      "5 row(s) whose load is not a plain number: ['Anexo B ou D', 'Anexo C']",
      "duplicate division and destination: ['I-2 Estaleiros']",
    ]);
  });
});
