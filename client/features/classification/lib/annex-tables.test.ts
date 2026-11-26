import { describe, expect, it } from "vitest";
import { pageTablesMarkdown, tableToMarkdown } from "./annex-tables";

describe("tableToMarkdown", () => {
  it("writes the first row as the heading and keeps every cell under its column", () => {
    expect(
      tableToMarkdown([
        ["Grupo", "Divisão", "Tipo"],
        ["A", "A-2", "EPT"],
      ]),
    ).toBe(
      "| Grupo | Divisão | Tipo |\n| --- | --- | --- |\n| A | A-2 | EPT |",
    );
  });

  it("pads a short row, and does not let a pipe or a line break split a cell", () => {
    const md = tableToMarkdown([["a", "b", "c"], ["x|y"], ["l1\nl2", "", "z"]]);
    expect(md.split("\n")[2]).toBe("| x/y |  |  |");
    expect(md.split("\n")[3]).toBe("| l1 l2 |  | z |");
  });

  it("is empty for no rows", () => {
    expect(tableToMarkdown([])).toBe("");
  });
});

describe("pageTablesMarkdown", () => {
  const tables = {
    pages: [
      { page: 5, tables: [{ rows: [["a"], ["1"]] }, { rows: [["b"], ["2"]] }] },
    ],
  };

  it("joins the tables of the page with a blank line", () => {
    expect(pageTablesMarkdown(tables, 5)).toBe(
      "| a |\n| --- |\n| 1 |\n\n| b |\n| --- |\n| 2 |",
    );
  });

  it("is empty for a page with no table", () => {
    expect(pageTablesMarkdown(tables, 6)).toBe("");
  });
});
