import { describe, expect, it } from "vitest";
import {
  compareForms,
  formLabel,
  fromFormRow,
  groupByNormative,
} from "./catalog";
import type { CbmscForm } from "./types";

const form = (normative: number, annex: string, name = "x"): CbmscForm => ({
  googleDocId: `${normative}${annex}${name}`.padEnd(20, "0"),
  normative,
  annex,
  name,
  active: true,
});

describe("compareForms", () => {
  it("orders by IN number numerically, not as text", () => {
    const sorted = [form(10, "B"), form(2, "J"), form(1, "C")].sort(
      compareForms,
    );
    expect(sorted.map((f) => f.normative)).toEqual([1, 2, 10]);
  });

  it("orders annexes A to Z before two-letter annexes", () => {
    const sorted = [form(1, "AA"), form(1, "K"), form(1, "C")].sort(
      compareForms,
    );
    expect(sorted.map((f) => f.annex)).toEqual(["C", "K", "AA"]);
  });
});

describe("groupByNormative", () => {
  it("groups sorted forms under their IN", () => {
    const groups = groupByNormative([form(2, "K"), form(1, "D"), form(2, "J")]);
    expect(
      groups.map((g) => [g.normative, g.forms.map((f) => f.annex)]),
    ).toEqual([
      [1, ["D"]],
      [2, ["J", "K"]],
    ]);
  });

  it("returns no groups for no forms", () => {
    expect(groupByNormative([])).toEqual([]);
  });
});

describe("formLabel", () => {
  it("names the IN and the annex", () => {
    expect(formLabel(form(1, "D"))).toBe("IN 1 · Anexo D");
  });
});

describe("fromFormRow", () => {
  it("maps database columns to camelCase", () => {
    expect(
      fromFormRow({
        google_doc_id: "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
        normative: 1,
        annex: "D",
        name: "Formulário para consulta técnica",
        active: false,
      }),
    ).toEqual({
      googleDocId: "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
      normative: 1,
      annex: "D",
      name: "Formulário para consulta técnica",
      active: false,
    });
  });
});
