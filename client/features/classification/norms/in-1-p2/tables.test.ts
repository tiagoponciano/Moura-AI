import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Cell = {
  raw: string;
  mark: "x" | "-" | null;
  refs: number[];
  vital: boolean;
  ok: boolean;
};
type Row = { part: number; system: string; norm: string; cells: Cell[] };
type Table = {
  headings?: string[];
  grids?: { page: number; part: number }[];
  table: number;
  title: string;
  rows: Row[];
  notes: { number: number; text: string }[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  doc: string;
  pdf_sha256: string;
  tables: { table: number; sha256: string; needs_human_look: number }[];
};

const read = <T>(file: string): T =>
  JSON.parse(readFileSync(join(__dirname, file), "utf-8")) as T;

/** Same canonical form the extractor hashes: sorted keys, no spaces. */
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

const manifest = read<Manifest>("manifest.json");
const tables = manifest.tables.map((entry) => ({
  entry,
  table: read<Table>(
    `tables/table-${String(entry.table).padStart(2, "0")}.json`,
  ),
}));
const byNumber = (n: number) => tables.find((t) => t.entry.table === n)!.table;

describe("IN 1 parte 2 extracted tables", () => {
  it("lists Tabelas 2 to 30 once each", () => {
    expect(manifest.tables.map((t) => t.table)).toEqual(
      Array.from({ length: 29 }, (_, i) => i + 2),
    );
  });

  it("records the source PDF hash, not the PDF", () => {
    expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each(tables)(
    "table $entry.table matches its manifest hash",
    ({ entry, table }) => {
      const digest = createHash("sha256")
        .update(canonical(table))
        .digest("hex");
      expect(digest).toBe(entry.sha256);
      expect(table.checks.needs_human_look).toHaveLength(
        entry.needs_human_look,
      );
    },
  );

  it.each(tables)(
    "table $entry.table cells follow the x/- grammar",
    ({ table }) => {
      for (const row of table.rows) {
        for (const cell of row.cells.filter((c) => c.raw)) {
          expect(cell.mark, `${row.system}: ${cell.raw}`).not.toBeNull();
          expect(cell.ok, `${row.system}: ${cell.raw}`).toBe(true);
        }
      }
    },
  );

  it.each(
    tables.filter(({ table }) => table.checks.needs_human_look.length === 0),
  )(
    "table $entry.table, with nothing flagged, uses exactly the notes it has",
    ({ table }) => {
      const numbers = table.notes.map((n) => n.number);
      expect(numbers).toEqual(numbers.map((_, i) => i + 1));
      const used = new Set(
        table.rows.flatMap((r) => r.cells.flatMap((c) => c.refs)),
      );
      expect([...used].sort((a, b) => a - b)).toEqual(numbers);
    },
  );

  it("keeps the footnote that conditions sprinklers in Tabela 5, checked against the PDF", () => {
    const table = byNumber(5);
    const sprinklers = table.rows.find(
      (r) => r.system === "Chuveiros automáticos",
    )!;
    expect(sprinklers.norm).toBe("IN 15");
    expect(sprinklers.cells.map((c) => c.refs)).toEqual([
      [2],
      [2],
      [2],
      [2],
      [2],
      [],
    ]);
    expect(table.notes[1].text).toBe(
      "Dispensado para C-1. Exigido para (C-2 com área > 3.000 m² e com carga de incêndio alta ou altíssima) e (C-3 com área > 5.000 m²).",
    );
  });

  it("reads a note that spans three lines as one note", () => {
    const note = byNumber(5).notes[4];
    expect(note.number).toBe(5);
    expect(note.text.startsWith("Exigido para C-2 e C-3.")).toBe(true);
    expect(note.text.endsWith("quando houver.")).toBe(true);
  });

  describe("Tabela 3, the table with two grids and notes on the next page", () => {
    const table3 = () => byNumber(3);

    it("keeps the headings between the grids out of the notes", () => {
      expect(table3().headings).toEqual([
        "DIVISÃO A-1 (INDEPENDENTE DE ÁREA OU ALTURA)",
        "DIVISÕES A-2 E A-3 COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m",
      ]);
      expect(table3().notes[0].text.startsWith("A-2 está isento")).toBe(true);
      expect(table3().notes[13].text).toBe(
        "Igual ao da ocupação predominante.",
      );
    });

    it("has the 18 notes in order, each in its own text", () => {
      expect(table3().notes.map((n) => n.number)).toEqual(
        Array.from({ length: 18 }, (_, i) => i + 1),
      );
      expect(
        table3().notes[4].text.startsWith("Exigido detecção automática"),
      ).toBe(true);
      expect(table3().notes[3].text.endsWith("somente nos átrios.")).toBe(true);
    });

    it("separates the two grids, and puts the row that falls on the next page in the second", () => {
      const parts = (n: number) => table3().rows.filter((r) => r.part === n);
      expect(parts(0)).toHaveLength(5);
      expect(parts(0).every((r) => r.cells.length === 3)).toBe(true);
      expect(parts(1)).toHaveLength(19);
      expect(parts(1).every((r) => r.cells.length === 5)).toBe(true);
      expect(parts(1).at(-1)?.system).toBe(
        "Sinalização para abandono de local",
      );
    });
  });

  it("has no unmapped ligature glyph or replacement character", () => {
    expect(JSON.stringify(tables.map((t) => t.table))).not.toMatch(/ϔ|\uFFFD/);
  });

  it("flags the tables a person still has to look at", () => {
    const flagged = tables
      .filter(({ table }) => table.checks.needs_human_look.length > 0)
      .map(({ entry }) => entry.table);
    expect(flagged).toEqual([3, 7, 8, 10, 12, 14, 15, 20, 22, 24, 26, 27, 30]);
  });
});
