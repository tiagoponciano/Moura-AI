import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Tables = { pages: { page: number; tables: { rows: string[][] }[] }[] };
type Manifest = {
  annex_tables: { pages: number; tables: number; sha256: string };
};
type Articles = { annexes: { page: number }[] };

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

const folders = readdirSync(__dirname, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(join(__dirname, name, "annex-tables.json")))
  .sort();

describe("annex tables, as extracted", () => {
  it("covers IN 7, IN 8 and IN 9", () => {
    expect(folders).toEqual(["in-7", "in-8", "in-9"]);
  });

  describe.each(folders)("%s", (folder) => {
    const read = <T>(file: string): T =>
      JSON.parse(readFileSync(join(__dirname, folder, file), "utf-8")) as T;
    const data = read<Tables>("annex-tables.json");
    const manifest = read<Manifest>("manifest.json");
    const annexPages = read<Articles>("articles.json").annexes.map(
      (a) => a.page,
    );

    it("matches the manifest hash and counts", () => {
      const digest = createHash("sha256").update(canonical(data)).digest("hex");
      expect(digest).toBe(manifest.annex_tables.sha256);
      expect(data.pages).toHaveLength(manifest.annex_tables.pages);
      const tables = data.pages.reduce((n, p) => n + p.tables.length, 0);
      expect(tables).toBe(manifest.annex_tables.tables);
    });

    it("keeps tables only of annex pages, in page order, each with a heading and a row", () => {
      const pages = data.pages.map((p) => p.page);
      expect(pages).toEqual([...pages].sort((a, b) => a - b));
      for (const page of data.pages) {
        expect(annexPages).toContain(page.page);
        for (const table of page.tables) {
          expect(table.rows.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it("leaves no PDF markup in a cell", () => {
      for (const page of data.pages) {
        for (const row of page.tables.flatMap((t) => t.rows)) {
          for (const cell of row)
            expect(cell).not.toMatch(/\*\*|<br>|^Col\d+$/);
        }
      }
    });
  });
});
