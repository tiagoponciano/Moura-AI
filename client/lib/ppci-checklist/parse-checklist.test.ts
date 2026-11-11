import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checklistSeedSql,
  itemReference,
  parseChecklist,
  readSheet,
  type SheetRow,
} from "./parse-checklist";

const row = (cells: Record<string, string>): SheetRow =>
  new Map(Object.entries(cells));

const status = { A: "0", B: "0", C: "0" };

/** A sheet shaped like Moura's: panel, group heading, header, items. */
const sheet = (body: Record<string, string>[]) =>
  new Map(
    [
      { A: "EXTINTORES", F: "2" },
      { A: "TOTAL", F: "2" },
      { A: "EXTINTORES" },
      { A: "Atende", B: "Adequar", C: "Ñ Aplic.", D: "Tarefas a realizar" },
      ...body,
    ].map((cells, index) => [index + 1, row(cells)]),
  );

describe("parseChecklist", () => {
  it("reads the items of each group in sheet order", () => {
    const groups = parseChecklist(
      sheet([
        { ...status, D: "Definir o agente" },
        { ...status, D: "Prever um extintor" },
      ]),
    );
    expect(groups).toEqual([
      {
        name: "EXTINTORES",
        panelCount: 2,
        items: [{ text: "Definir o agente" }, { text: "Prever um extintor" }],
      },
    ]);
  });

  it("skips the header row and the not-applicable switch", () => {
    const [group] = parseChecklist(
      sheet([
        { A: "1", D: "Não possui este sistema" },
        { ...status, D: "Definir o agente" },
      ]),
    );
    expect(group.items).toEqual([{ text: "Definir o agente" }]);
  });

  it("keeps a sub-heading as the section of the items after it", () => {
    const [group] = parseChecklist(
      sheet([
        { D: "RTI", K: "0" },
        { ...status, D: "Volume da reserva" },
      ]),
    );
    expect(group.items).toEqual([
      { text: "Volume da reserva", section: "RTI" },
    ]);
  });

  it("collapses whitespace in item text", () => {
    const [group] = parseChecklist(
      sheet([{ ...status, D: " Cotar  as\nportas " }]),
    );
    expect(group.items[0].text).toBe("Cotar as portas");
  });

  it("fails when a group in the panel has no heading in the sheet", () => {
    const rows = new Map([
      [1, row({ A: "EXTINTORES", F: "1" })],
      [2, row({ A: "ALARME", F: "1" })],
      [3, row({ A: "EXTINTORES" })],
    ]);
    expect(() => parseChecklist(rows)).toThrow(
      "Groups not found in the sheet: ALARME",
    );
  });
});

describe("itemReference", () => {
  it("takes the article and the normative it cites", () => {
    expect(itemReference("Prever extintores conforme Art.10 da IN06;")).toBe(
      "Art.10 da IN06",
    );
  });

  it("takes the part of a normative", () => {
    expect(itemReference("conforme tabela 1 da IN01 parte 2;")).toBe(
      "tabela 1 da IN01 parte 2",
    );
  });

  it("is empty when the item cites no normative", () => {
    expect(
      itemReference("Informar a escala em todas as pranchas"),
    ).toBeUndefined();
  });
});

describe("readSheet", () => {
  it("resolves shared strings and plain values by column", () => {
    const rows = readSheet(
      '<row r="3"><c r="A3" t="s"><v>0</v></c><c r="F3"><v>7</v></c></row>',
      "<sst><si><t>A &amp; B</t></si></sst>",
    );
    expect(rows.get(3)).toEqual(row({ A: "A & B", F: "7" }));
  });
});

it("escapes quotes in the seed", () => {
  const sql = checklistSeedSql("v1", [
    { name: "G", panelCount: 1, items: [{ text: "Porta 'corta-fogo'" }] },
  ]);
  expect(sql).toContain("('v1', 1, 1, null, 'Porta ''corta-fogo''', null)");
});

it("seeds every item of the v1 sheet in its 12 groups", () => {
  const sql = readFileSync(
    join(
      __dirname,
      "../../../supabase/migrations/20261109000100_ppci_checklist_v1.sql",
    ),
    "utf8",
  );
  const groups = sql.match(/^ {2}\('v1', \d+, '/gm) ?? [];
  const items = sql.match(/^ {2}\('v1', \d+, \d+, /gm) ?? [];
  expect(groups).toHaveLength(12);
  expect(items).toHaveLength(154);
});
