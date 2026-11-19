import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Article = { number: number; page: number; text: string };
type Articles = {
  doc: string;
  preamble: string;
  articles: Article[];
  annexes: { page: number; title: string; text: string }[];
  checks: { needs_human_look: string[] };
};
type Manifest = {
  doc: string;
  source_url: string;
  pdf_sha256: string;
  articles: {
    count: number;
    annex_pages: number;
    sha256: string;
    needs_human_look: number;
  };
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
  .filter((name) => existsSync(join(__dirname, name, "articles.json")))
  .sort();

describe("norm articles, as extracted", () => {
  it("covers the instructions of the Drive folder that have articles", () => {
    expect(folders).toEqual(
      expect.arrayContaining([
        "in-1-p1",
        "in-1-p2",
        "in-3",
        "in-5",
        "in-6",
        "in-7",
      ]),
    );
  });

  describe.each(folders)("%s", (folder) => {
    const read = <T>(file: string): T =>
      JSON.parse(readFileSync(join(__dirname, folder, file), "utf-8")) as T;
    const data = read<Articles>("articles.json");
    const manifest = read<Manifest>("manifest.json");

    it("matches the manifest hash and counts", () => {
      const digest = createHash("sha256").update(canonical(data)).digest("hex");
      expect(digest).toBe(manifest.articles.sha256);
      expect(data.articles).toHaveLength(manifest.articles.count);
      expect(data.annexes).toHaveLength(manifest.articles.annex_pages);
      expect(data.doc).toBe(manifest.doc);
    });

    it("numbers the articles 1, 2, 3 without a gap, each starting with its own number", () => {
      data.articles.forEach((article, index) => {
        expect(article.number).toBe(index + 1);
        expect(article.text).toMatch(new RegExp(`^Art\\. ?${index + 1}\\D`));
      });
    });

    it("keeps the page of each article in order", () => {
      const pages = data.articles.map((a) => a.page);
      expect(pages).toEqual([...pages].sort((a, b) => a - b));
    });

    it("links to a Drive file and records a PDF hash, not the PDF", () => {
      expect(manifest.source_url).toContain("drive.google.com/file/d/");
      expect(manifest.pdf_sha256).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
