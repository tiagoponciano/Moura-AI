// Reads Moura's "Check list de projetos" .xlsx and writes the migration that
// seeds it as one checklist version. Usage:
//   node scripts/import-ppci-checklist.mjs <sheet.xlsx> <version> <migration-timestamp>
// See client/docs/ppci-checklist.md.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import {
  checklistSeedSql,
  parseChecklist,
  readSheet,
} from "../lib/ppci-checklist/parse-checklist.ts";

const [file, version, timestamp] = process.argv.slice(2);
if (
  !file ||
  !/^v\d+$/.test(version ?? "") ||
  !/^\d{14}$/.test(timestamp ?? "")
) {
  console.error(
    "Usage: node scripts/import-ppci-checklist.mjs <sheet.xlsx> <vN> <YYYYMMDDHHMMSS>",
  );
  process.exit(1);
}

const zip = new PizZip(await readFile(file));
const xml = (path) => zip.file(path)?.asText() ?? "";
const groups = parseChecklist(
  readSheet(xml("xl/worksheets/sheet1.xml"), xml("xl/sharedStrings.xml")),
);

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  `../../supabase/migrations/${timestamp}_ppci_checklist_${version}.sql`,
);
await writeFile(out, checklistSeedSql(version, groups));
for (const group of groups) {
  const note =
    group.items.length === group.panelCount
      ? ""
      : ` (the sheet's panel says ${group.panelCount})`;
  console.log(`${group.name}: ${group.items.length} items${note}`);
}
const items = groups.reduce((sum, group) => sum + group.items.length, 0);
console.log(`${groups.length} groups, ${items} items → ${out}`);
