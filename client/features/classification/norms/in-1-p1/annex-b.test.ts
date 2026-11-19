import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Field = {
  section: string;
  group: string;
  field: string;
  required: boolean;
};
type AnnexB = { fields: Field[]; checks: { needs_human_look: string[] } };
type Manifest = {
  annex_a: { sha256: string };
  annex_b: { fields: number; sha256: string; needs_human_look: number };
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
const sections = new Set(annex.fields.map((f) => f.section));
const has = (section: string, text: string) =>
  annex.fields.some((f) => f.section === section && f.field.includes(text));

describe("IN 1 parte 1, Annex B, as extracted", () => {
  it("matches the manifest hash and count", () => {
    const digest = createHash("sha256").update(canonical(annex)).digest("hex");
    expect(digest).toBe(manifest.annex_b.sha256);
    expect(annex.fields).toHaveLength(manifest.annex_b.fields);
    expect(annex.checks.needs_human_look).toHaveLength(
      manifest.annex_b.needs_human_look,
    );
  });

  it("keeps the Annex A entry of the shared manifest", () => {
    expect(manifest.annex_a.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("reads the sections of the request form", () => {
    expect([...sections]).toEqual(
      expect.arrayContaining([
        "DADOS DO IMÓVEL",
        "ABA ANÁLISE",
        "ABA HABITE-SE",
        "ABA FUNCIONAMENTO",
        "ABA EVENTOS TEMPORÁRIOS",
        "IDENTIFICAÇÃO NOMINAL",
      ]),
    );
  });

  it("has the block fields that the project panel keeps", () => {
    expect(has("ABA ANÁLISE", "Área total do bloco")).toBe(true);
    expect(has("ABA ANÁLISE", "Altura do bloco")).toBe(true);
    expect(has("ABA ANÁLISE", "Lotação de pessoas")).toBe(true);
  });

  it("marks the CRC registry of the accountant as required", () => {
    const crc = annex.fields.find((f) => f.field.includes("Registro no CRC"));
    expect(crc?.required).toBe(true);
    expect(crc?.group).toBe("Responsável Contábil");
  });

  it("does not carry the group of one section into the next", () => {
    const anexos = annex.fields.filter((f) => f.section === "ANEXOS");
    expect(anexos.length).toBeGreaterThan(0);
    for (const field of anexos) expect(field.group).toBe("");
  });
});
