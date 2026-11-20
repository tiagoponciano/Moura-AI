import { describe, expect, it } from "vitest";
import { reviewSummary } from "./review-summary";
import type { TemplateField } from "./templates";

const field = (over: Partial<TemplateField>): TemplateField => ({
  name: "f",
  type: "string",
  label: "Campo",
  description: "",
  ...over,
});

describe("reviewSummary", () => {
  it("lists the filled fields in the order of the form, with where each value came from", () => {
    const summary = reviewSummary(
      [
        field({ name: "a", label: "Nome" }),
        field({ name: "b", label: "Cidade", type: "string" }),
      ],
      { a: "Loja Centro", b: "Joinville" },
      { a: "project", b: "assistant" },
    );
    expect(summary.filled).toEqual([
      { name: "a", label: "Nome", text: "Loja Centro", tag: "projeto" },
      { name: "b", label: "Cidade", text: "Joinville", tag: "IA" },
    ]);
    expect(summary.missingRequired).toEqual([]);
  });

  it("names the required fields that are still empty, and ignores an empty optional one", () => {
    const summary = reviewSummary(
      [
        field({ name: "a", label: "Lotação", required: true }),
        field({ name: "b", label: "Telefone" }),
        field({ name: "c", label: "CREA", required: true }),
      ],
      { a: "  ", c: "123" },
      {},
    );
    expect(summary.missingRequired).toEqual(["Lotação"]);
    expect(summary.filled.map((i) => i.label)).toEqual(["CREA"]);
  });

  it("prints a number as text and a switch as Sim or Não", () => {
    const summary = reviewSummary(
      [
        field({ name: "n", label: "Área", type: "number" }),
        field({ name: "s", label: "Possui", type: "boolean" }),
        field({ name: "t", label: "Outro", type: "boolean" }),
      ],
      { n: 820, s: true, t: false },
      {},
    );
    expect(summary.filled.map((i) => i.text)).toEqual(["820", "Sim", "Não"]);
  });

  it("leaves out a marked option that is off, since the document prints nothing for it", () => {
    const summary = reviewSummary(
      [field({ name: "m", label: "( ) interna", type: "boolean", mark: true })],
      { m: false },
      {},
    );
    expect(summary.filled).toEqual([]);
  });

  it("shows a required switch nobody touched as Não, and does not call it missing, as the document does", () => {
    const summary = reviewSummary(
      [field({ name: "s", label: "Possui", type: "boolean", required: true })],
      {},
      {},
    );
    expect(summary.missingRequired).toEqual([]);
    expect(summary.filled.map((i) => i.text)).toEqual(["Não"]);
  });
});
