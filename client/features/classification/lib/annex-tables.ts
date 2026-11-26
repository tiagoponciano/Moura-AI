/** The tables of the annexes, as `tools/norms/extract_annex_tables.py` writes them. */
export type AnnexTables = {
  pages: { page: number; tables: { rows: string[][] }[] }[];
};

const cell = (text: string) => text.replace(/\|/g, "/").replace(/\n/g, " ");

/** One table as a Markdown grid; the first row is the heading. Short rows are padded. */
export function tableToMarkdown(rows: string[][]): string {
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const line = (row: string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cell(row[i] ?? "")).join(" | ")} |`;
  return [
    line(rows[0]),
    `|${" --- |".repeat(width)}`,
    ...rows.slice(1).map(line),
  ].join("\n");
}

/** The tables of one annex page as Markdown, separated by a blank line; empty when it has none. */
export function pageTablesMarkdown(tables: AnnexTables, page: number): string {
  const found = tables.pages.find((entry) => entry.page === page);
  return found
    ? found.tables.map((table) => tableToMarkdown(table.rows)).join("\n\n")
    : "";
}
