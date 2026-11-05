import { describe, expect, it } from "vitest";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { assistantState, filterForms, findFormTemplate } from "./cbmsc-forms";
import type { TemplateEntry } from "./templates";

const form = (normative: number, annex: string, name: string): CbmscForm => ({
  googleDocId: `${normative}${annex}`.padEnd(20, "0"),
  normative,
  annex,
  name,
  active: true,
});

const forms = [
  form(1, "D", "Formulário para consulta técnica"),
  form(2, "K", "Requerimento para ressarcimento de multa"),
  form(28, "C", "Plano de Implementação de Brigada de Incêndio (PIBI)"),
];

describe("filterForms", () => {
  it("returns every form for a blank query", () => {
    expect(filterForms(forms, "  ")).toEqual(forms);
  });

  it("matches names without accents or case", () => {
    expect(filterForms(forms, "TECNICA").map((f) => f.annex)).toEqual(["D"]);
  });

  it("requires every word to match", () => {
    expect(filterForms(forms, "brigada pibi").map((f) => f.normative)).toEqual([
      28,
    ]);
  });

  it("matches the IN and annex label", () => {
    expect(filterForms(forms, "in 2 anexo k").map((f) => f.annex)).toEqual([
      "K",
    ]);
  });
});

const template: TemplateEntry = {
  id: "in-1-anexo-d",
  name: "IN 1 – Anexo D",
  type: "docx",
  file: "/x.docx",
  schema: "/x.json",
  cbmsc: { normative: 1, annex: "D", sourceTextHash: "abc" },
};

describe("findFormTemplate", () => {
  const example: TemplateEntry = {
    ...template,
    id: "example",
    cbmsc: undefined,
  };

  it("finds the copy with the same IN and annex", () => {
    expect(
      findFormTemplate([example, template], { normative: 1, annex: "D" }),
    ).toBe(template);
  });

  it("does not match another annex or a template without a form", () => {
    expect(
      findFormTemplate([example, template], { normative: 1, annex: "E" }),
    ).toBeUndefined();
  });
});

describe("assistantState", () => {
  it("is unavailable without a tagged copy", () => {
    expect(assistantState(undefined, "abc")).toBe("unavailable");
  });

  it("waits for the current version", () => {
    expect(assistantState(template, undefined)).toBe("checking");
  });

  it("is ready when the text is the one the copy was made from", () => {
    expect(assistantState(template, "abc")).toBe("ready");
  });

  it("blocks a copy whose source text changed", () => {
    expect(assistantState(template, "other")).toBe("outdated");
  });

  it("stays usable with a warning when Google cannot be read", () => {
    expect(assistantState(template, null)).toBe("unverified");
  });
});
