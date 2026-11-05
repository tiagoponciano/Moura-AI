import { describe, expect, it } from "vitest";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { filterForms } from "./cbmsc-forms";

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
