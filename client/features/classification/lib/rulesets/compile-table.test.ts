import { describe, expect, it } from "vitest";
import type { Condition } from "../engine/types";
import { compileTable, UncodedNoteError } from "./compile-table";
import type { ExtractedTable, TableSpec } from "./types";

const cell = (
  mark: "x" | "-",
  refs: number[] = [],
  raw: string = mark,
  vital = false,
) => ({
  raw,
  mark,
  refs,
  vital,
});

const table: ExtractedTable = {
  table: 9,
  title: "TEST",
  rows: [
    {
      system: "Extintores",
      norm: "IN 6",
      vital_on_label: true,
      cells: [cell("x"), cell("-")],
    },
    {
      system: "Chuveiros automáticos",
      norm: "IN 15",
      vital_on_label: false,
      cells: [cell("x", [1], "x¹"), cell("x", [2, 3], "x²⁻³")],
    },
    {
      system: "Controle de fumaça",
      norm: "IN 10",
      vital_on_label: false,
      cells: [cell("-"), cell("x", [3], "x³")],
    },
  ],
  notes: [
    { number: 1, text: "Dispensado para C-1." },
    { number: 2, text: "Pode ser substituído por detecção." },
    { number: 3, text: "Exigido nos átrios." },
  ],
};

const isC2: Condition = { fact: "division", op: "eq", value: "C-2" };
const spec: TableSpec = {
  table: 9,
  base: { fact: "regime", op: "eq", value: "large" },
  columns: [
    {
      index: 0,
      label: "Térreo",
      slug: "ground",
      when: { fact: "k", op: "eq", value: "a" },
    },
    {
      index: 1,
      label: "H ≤ 6",
      slug: "h6",
      when: { fact: "k", op: "eq", value: "b" },
    },
  ],
  notes: [
    {
      number: 1,
      effects: [{ kind: "require_when", when: isC2 }],
      questions: [],
    },
    {
      number: 2,
      effects: [
        {
          kind: "substitutable",
          by: ["automatic_detection"],
          note: "Pode ser substituído",
          when: isC2,
        },
        { kind: "info", text: "Reservatório de 2.000 litros." },
      ],
      questions: [],
    },
    {
      number: 3,
      effects: [{ kind: "require_when", when: isC2, scope: "atria" }],
      questions: [],
    },
  ],
};

const rules = compileTable(table, spec);
const byId = (id: string) => rules.find((r) => r.id === id)!;

describe("compileTable", () => {
  it("turns an x without notes into one rule and a - into none", () => {
    expect(byId("IN1P2-T09-extinguishers-ground-req").then).toEqual({
      require: "extinguishers",
      vital: true,
    });
    expect(rules.some((r) => r.id.includes("extinguishers-h6"))).toBe(false);
    expect(rules.some((r) => r.id.includes("smoke_control-ground"))).toBe(
      false,
    );
  });

  it("adds the table base and the column to every condition", () => {
    const rule = byId("IN1P2-T09-extinguishers-ground-req");
    expect(rule.when).toEqual({
      all: [spec.base, spec.columns[0].when],
    });
  });

  it("makes one rule per requirement of the notes, keeping the scope", () => {
    expect(byId("IN1P2-T09-smoke_control-h6-req1").then).toEqual({
      require: "smoke_control",
      vital: false,
      scope: "atria",
    });
  });

  it("makes a substitution rule that carries the note", () => {
    expect(byId("IN1P2-T09-sprinklers-h6-sub1").then).toEqual({
      substitute: "sprinklers",
      by: ["automatic_detection"],
      note: "Pode ser substituído",
    });
  });

  it("puts information notes on the rule without changing the condition", () => {
    expect(byId("IN1P2-T09-sprinklers-h6-req1").note).toBe(
      "Reservatório de 2.000 litros.",
    );
  });

  it("marks every rule provisional with its source quote and validity", () => {
    for (const rule of rules) {
      expect(rule.status).toBe("provisional");
      expect(rule.validFrom).toBe("2024-04-24");
      expect(rule.source.doc).toBe("IN-1-P2");
    }
    expect(byId("IN1P2-T09-sprinklers-ground-req1").source).toEqual({
      doc: "IN-1-P2",
      locator: "Tabela 9, Chuveiros automáticos, Térreo",
      quote:
        "Chuveiros automáticos (Térreo): x¹ | Nota 1: Dispensado para C-1.",
    });
  });

  it("takes vital from the row label or from the cell", () => {
    const vitalCell: ExtractedTable = {
      ...table,
      rows: [
        {
          ...table.rows[0],
          vital_on_label: false,
          cells: [cell("x", [], "x (V)", true)],
        },
      ],
    };
    const [rule] = compileTable(vitalCell, {
      ...spec,
      columns: [spec.columns[0]],
    });
    expect(rule.then).toEqual({ require: "extinguishers", vital: true });
  });

  it("refuses a cell whose note has no reading", () => {
    const missing: TableSpec = {
      ...spec,
      notes: spec.notes.filter((n) => n.number !== 3),
    };
    expect(() => compileTable(table, missing)).toThrow(UncodedNoteError);
    expect(() => compileTable(table, missing)).toThrow(
      "Tabela 9: note 3 is cited by a cell but has no reading",
    );
  });

  it("refuses a system label nobody reviewed", () => {
    const odd: ExtractedTable = {
      ...table,
      rows: [{ ...table.rows[0], system: "Espuma" }],
    };
    expect(() => compileTable(odd, spec)).toThrow(
      'Unknown system label: "Espuma"',
    );
  });
});
