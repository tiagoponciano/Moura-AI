import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Quadro1 = { parameter: string; limit: string };
type Quadro2 = {
  group: string;
  division: string;
  height: string;
  area: string;
};
type Quadro3 = { group: string; division: string; criterion: string };
type AnnexA = {
  quadro_1_risco_ii: Quadro1[];
  quadro_2_risco_iii_area_altura: Quadro2[];
  quadro_3_risco_iii_criterio: Quadro3[];
  notes: { id: string; text: string }[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  pdf_sha256: string;
  annex_a: {
    rows: number;
    notes: number;
    sha256: string;
    needs_human_look: number;
  };
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

const annex = read<AnnexA>("annex-a.json");
const manifest = read<Manifest>("manifest.json");
const q2 = annex.quadro_2_risco_iii_area_altura;

describe("IN 1 parte 1, Annex A, as extracted", () => {
  it("matches the manifest hash and counts, and records the PDF hash, not the PDF", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_a.sha256);
    const rows =
      annex.quadro_1_risco_ii.length +
      q2.length +
      annex.quadro_3_risco_iii_criterio.length;
    expect(rows).toBe(manifest.annex_a.rows);
    expect(annex.notes).toHaveLength(manifest.annex_a.notes);
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps the risk II limits as printed in quadro 1", () => {
    const byName = new Map(
      annex.quadro_1_risco_ii.map((r) => [r.parameter, r.limit]),
    );
    expect(byName.get("Área")).toBe("≤ 750 m²");
    expect(byName.get("Altura")).toBe("≤ 3 pavimentos");
    expect(byName.get("Uso/Armazenamento de GLP")).toBe("≤ 190 kg");
  });

  it("gives every quadro 2 row a division inside its group (or 'Todas'), a height and an area", () => {
    for (const row of q2) {
      if (row.division !== "Todas") {
        expect(row.group, row.division).toContain(row.division[0]);
      }
      expect(row.height.length).toBeGreaterThan(0);
      expect(row.area.length).toBeGreaterThan(0);
    }
  });

  it("keeps the rows that continue a division, such as B-1 and B-2 by height", () => {
    const b = q2.filter((r) => r.division === "B-1, B-2");
    expect(b.map((r) => [r.height, r.area])).toEqual([
      ["≤ 6", "≤ 5.000"],
      ["6 < h ≤ 12", "≤ 4.000"],
    ]);
  });

  it("reads the notes a to e in order", () => {
    expect(annex.notes.map((n) => n.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("lists the F criterion that ends in an 'E' for a person to confirm", () => {
    expect(annex.checks.needs_human_look).toHaveLength(
      manifest.annex_a.needs_human_look,
    );
    expect(annex.checks.needs_human_look.join(" ")).toContain("F TODAS");
  });
});
