import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Notes = {
  doc: string;
  articles: { number: number; page: number; text: string }[];
  annexes: unknown[];
};
type Manifest = {
  doc: string;
  source_url: string;
  pdf_sha256: string;
  articles: { count: number; sha256: string };
};

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
  .sort();

describe("technical notes, as extracted", () => {
  it("keeps the two 2025 notes of the DSCI", () => {
    expect(folders).toEqual(["nt-01-2025", "nt-02-2025"]);
  });

  describe.each(folders)("%s", (folder) => {
    const read = <T>(file: string): T =>
      JSON.parse(readFileSync(join(__dirname, folder, file), "utf-8")) as T;
    const data = read<Notes>("articles.json");
    const manifest = read<Manifest>("manifest.json");

    it("matches the manifest hash and count", () => {
      const digest = createHash("sha256").update(canonical(data)).digest("hex");
      expect(digest).toBe(manifest.articles.sha256);
      expect(data.articles).toHaveLength(manifest.articles.count);
      expect(data.doc).toBe(manifest.doc);
      expect(data.annexes).toEqual([]);
    });

    it("numbers the sections 1, 2, 3, each starting with its own number", () => {
      data.articles.forEach((section, index) => {
        expect(section.number).toBe(index + 1);
        expect(section.text).toMatch(
          new RegExp(`^${index + 1}\\. [A-ZÁÉÍÓÚÂÊÔÃÕÇ]`),
        );
      });
    });

    it("leaves out the signature block", () => {
      for (const section of data.articles) {
        expect(section.text).not.toContain("Assinaturas do documento");
        expect(section.text).not.toContain("CPF");
      }
    });

    it("links to a Drive file and records a PDF hash", () => {
      expect(manifest.source_url).toContain("drive.google.com/file/d/");
      expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
