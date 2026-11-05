import { readFileSync } from "node:fs";
import { join } from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { isProjectFieldKey } from "./project-fields";
import type { TemplateEntry, TemplateSchema } from "./templates";

const PUBLIC = join(__dirname, "../../../public");
const read = (path: string) => readFileSync(join(PUBLIC, path));

const entries = JSON.parse(
  read("templates/index.json").toString(),
) as TemplateEntry[];

const textOf = (file: string) => {
  const xml = new PizZip(read(file)).file("word/document.xml")?.asText() ?? "";
  return [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)]
    .map((match) => match[1])
    .join("");
};

const tagsOf = (file: string) => {
  const text = textOf(file);
  return new Set([...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((tag) => tag[1]));
};

describe.each(entries)("template $id", (entry) => {
  const schema = JSON.parse(read(entry.schema).toString()) as TemplateSchema;

  it("has exactly one field per tag in the document", () => {
    const expected = schema.fields.flatMap((field) =>
      field.options ? field.options.map((option) => option.tag) : field.name,
    );
    expect([...tagsOf(entry.file)].sort()).toEqual(expected.sort());
  });

  it("ties fields only to keys a project shares, each once", () => {
    const keys = schema.fields.flatMap((field) => field.projectKey ?? []);
    expect(keys.filter((key) => !isProjectFieldKey(key))).toEqual([]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has no note about copying the Google Doc in its headers", () => {
    const zip = new PizZip(read(entry.file));
    const headers = Object.keys(zip.files)
      .filter((path) => /^word\/header\d*\.xml$/.test(path))
      .map((path) => zip.file(path)?.asText() ?? "")
      .join("");
    expect(headers).not.toContain("uso exclusivo do CBMSC");
    expect(headers).not.toContain("fazer uma cópia");
  });

  it("renders with no tag left", () => {
    const doc = new Docxtemplater(new PizZip(read(entry.file)), {
      delimiters: { start: "{{", end: "}}" },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });
    doc.render({});
    const xml = doc.getZip().file("word/document.xml")?.asText() ?? "";
    expect(xml).not.toContain("{{");
  });
});

it("has a template for every form in the catalog's seed", () => {
  const sql = readFileSync(
    join(PUBLIC, "../../supabase/migrations/20261105000000_cbmsc_forms.sql"),
    "utf8",
  );
  const seeded = [...sql.matchAll(/', (\d+), '([A-Z]+)', '/g)].map(
    (match) => `${match[1]}-${match[2]}`,
  );
  expect(seeded).toHaveLength(28);
  expect(
    entries
      .map((entry) => `${entry.cbmsc?.normative}-${entry.cbmsc?.annex}`)
      .sort(),
  ).toEqual(seeded.sort());
});

it("gives each official form at most one template", () => {
  const forms = entries
    .filter((entry) => entry.cbmsc)
    .map((entry) => `${entry.cbmsc?.normative}-${entry.cbmsc?.annex}`);
  expect(new Set(forms).size).toBe(forms.length);
});

describe("IN 1 Anexo D", () => {
  const text = textOf("templates/cbmsc/in-1-anexo-d.docx");
  const between = (start: string, end: string) =>
    text.slice(text.indexOf(start) + start.length, text.indexOf(end));

  it("puts the question in the description block, with no blank lines left", () => {
    expect(between("4. Descrição da consulta", "{{question}}")).not.toContain(
      "_",
    );
  });

  it("keeps the signature line", () => {
    expect(between("{{question}}", "Assinatura do solicitante")).toContain(
      "___",
    );
  });
});
