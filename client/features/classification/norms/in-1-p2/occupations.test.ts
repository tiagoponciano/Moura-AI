import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Table = {
  rows: {
    group: string;
    division: string;
    description: string;
    page: number;
  }[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  pdf_sha256: string;
  rows: number;
  sha256: string;
  needs_human_look: number;
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

const table = read<Table>("occupations.json");
const manifest = read<Manifest>("occupations.manifest.json");

describe("IN 1 parte 2, Tabela 1, as extracted", () => {
  it("matches the manifest hash and row count, and records the PDF hash, not the PDF", () => {
    expect(createHash("sha256").update(canonical(table)).digest("hex")).toBe(
      manifest.sha256,
    );
    expect(table.rows).toHaveLength(manifest.rows);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives every division a group, a description and an id inside that group", () => {
    for (const row of table.rows) {
      expect(row.division).toMatch(/^[A-M]-\d{1,2}$/);
      expect(row.division[0]).toBe(row.group);
      expect(row.description.length).toBeGreaterThan(0);
    }
  });

  it("lists each division once and flags nothing for a person", () => {
    const ids = table.rows.map((r) => r.division);
    expect(new Set(ids).size).toBe(ids.length);
    expect(table.checks.needs_human_look).toEqual([]);
    expect(manifest.needs_human_look).toBe(0);
  });

  it("keeps the commercial divisions as printed, checked against the PDF", () => {
    const description = (d: string) =>
      table.rows.find((r) => r.division === d)?.description;
    expect(description("C-1")).toBe("Comércio com baixa carga de incêndio");
    expect(description("C-2")).toBe(
      "Comércio com média, alta ou altíssima carga de incêndio",
    );
    expect(description("C-3")).toBe("Shopping centers");
  });
});
