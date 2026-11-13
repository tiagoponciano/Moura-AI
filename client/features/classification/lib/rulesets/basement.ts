import type { Condition, Rule } from "../engine/types";
import table30Json from "../../norms/in-1-p2/tables/table-30.json";
import { NORM_DOC, NORM_VALID_FROM } from "./compile-table";
import { fact } from "./group-c-conditions";

type Table30 = {
  grids: { header_rows: string[][] }[];
  notes: { number: number; text: string }[];
};
const table30 = table30Json as unknown as Table30;

/** The fact the rules derive: which row of Tabela 30 applies. */
export const BASEMENT_CASE_FACT = "basement_case";

type Level = "first" | "other";
type Band = "b100" | "b250" | "b500" | "over500" | "over100";
type Use = "all" | "storage" | "assembly" | "other";

const LEVEL_LABELS: Record<string, Level> = {
  "No primeiro ou segundo subsolo": "first",
  "Nos demais subsolos": "other",
};
const BAND_LABELS: Record<string, Band> = {
  "Até 100": "b100",
  "Entre 100 e 250": "b250",
  "Entre 250 e 500": "b500",
  "Acima de 500": "over500",
  "Acima de 100": "over100",
};
const USE_LABELS: Record<string, Use> = {
  Todas: "all",
  Depósito: "storage",
  "Depósito⁵": "storage",
  "Divisões F-1, F-3, F-5, F-6, F-10 e F-11": "assembly",
  "Outras ocupações": "other",
};

const squash = (text: string) => text.replace(/\s+/g, " ").trim();
const keyOf = (level: Level, band: Band, use: Use) => `${level}-${band}-${use}`;

type Row = {
  level: Level;
  band: Band;
  use: Use;
  restricted: boolean;
  measures: string;
};

/** The rows of Tabela 30 as printed; a label nobody reviewed throws instead of dropping a row. */
const ROWS: Row[] = (() => {
  const rows: Row[] = [];
  let level: Level | undefined;
  let band: Band | undefined;
  for (const [
    levelCell,
    bandCell,
    useCell,
    measures,
  ] of table30.grids[0].header_rows.slice(1)) {
    if (levelCell) {
      level = LEVEL_LABELS[squash(levelCell)];
      if (!level) throw new Error(`Tabela 30: unknown level "${levelCell}"`);
    }
    if (bandCell) {
      band = BAND_LABELS[squash(bandCell)];
      if (!band) throw new Error(`Tabela 30: unknown area "${bandCell}"`);
    }
    const use = USE_LABELS[squash(useCell)];
    if (!use || !level || !band)
      throw new Error(`Tabela 30: unknown occupation "${useCell}"`);
    rows.push({
      level,
      band,
      use,
      restricted: squash(useCell).endsWith("⁵"),
      measures: squash(measures.replace(/\n- /g, " | ").replace(/^- /, "")),
    });
  }
  return rows;
})();

const MEASURES = new Map(
  ROWS.map((r) => [keyOf(r.level, r.band, r.use), r.measures]),
);

const RESIDENTIAL = fact("division", "in", ["A-1", "A-2", "A-3"]);
const has = (level: Level, band: Band, use: Use) =>
  MEASURES.has(keyOf(level, band, use));

const levelCondition = (level: Level) =>
  fact("basement_level", "eq", level === "first" ? "first_second" : "other");
const bandCondition = (band: Band): Condition => {
  const area = (op: "lte" | "gt", v: number) => fact("basement_area_m2", op, v);
  switch (band) {
    case "b100":
      return area("lte", 100);
    case "b250":
      return { all: [area("gt", 100), area("lte", 250)] };
    case "b500":
      return { all: [area("gt", 250), area("lte", 500)] };
    case "over500":
      return area("gt", 500);
    case "over100":
      return area("gt", 100);
  }
};

/**
 * When a basement use lands on a row. A row marked "Depósito⁵" is for storage in
 * a residential building only; a use with no row of its own in the band
 * (assembly above 500 m², a non-residential store) reads the "Outras ocupações" row.
 */
function useCondition(level: Level, band: Band, use: Use): Condition {
  if (use === "all") return { all: [] };
  const restricted = ROWS.find(
    (r) => r.level === level && r.band === band && r.use === "storage",
  )?.restricted;
  const storage = fact("basement_use", "eq", "storage");
  const assembly = fact("basement_use", "eq", "assembly");
  if (use === "storage")
    return restricted ? { all: [storage, RESIDENTIAL] } : storage;
  if (use === "assembly") return assembly;
  const fallbacks: Condition[] = [fact("basement_use", "eq", "other")];
  if (has(level, band, "storage") && restricted)
    fallbacks.push({ all: [storage, { not: RESIDENTIAL }] });
  if (!has(level, band, "storage")) fallbacks.push(storage);
  if (!has(level, band, "assembly")) fallbacks.push(assembly);
  return { any: fallbacks };
}

/** One derive rule per row of Tabela 30. */
export const BASEMENT_RULES: Rule[] = ROWS.map((row, index) => {
  const key = keyOf(row.level, row.band, row.use);
  return {
    id: `IN1P2-T30-${key}`,
    name: `Subsolo, Tabela 30, ${key}`,
    version: "1",
    validFrom: NORM_VALID_FROM,
    stage: "derive",
    priority: index + 1,
    when: {
      all: [
        fact("has_basement", "eq", true),
        levelCondition(row.level),
        bandCondition(row.band),
        useCondition(row.level, row.band, row.use),
      ],
    },
    then: { set: { fact: BASEMENT_CASE_FACT, value: key } },
    source: {
      doc: NORM_DOC,
      locator: "Anexo B, Tabela 30",
      quote: row.measures,
    },
    status: "provisional",
  };
});

const SUPERSCRIPT: Record<string, number> = {
  "¹": 1,
  "²": 2,
  "³": 3,
  "⁴": 4,
  "⁵": 5,
  "⁶": 6,
};

/**
 * The additional measures of a basement, in words: the printed alternatives,
 * the notes they cite and note 7, which holds for every basement.
 */
export function basementMeasuresText(key: string): string | undefined {
  const measures = MEASURES.get(key);
  if (!measures) return undefined;
  const cited = [
    ...new Set(
      [...measures].flatMap((c) => (SUPERSCRIPT[c] ? [SUPERSCRIPT[c]] : [])),
    ),
  ].sort((a, b) => a - b);
  const noteText = (n: number) =>
    table30.notes.find((x) => x.number === n)?.text ?? "";
  const readable = measures.replace(
    /[¹²³⁴⁵⁶]/g,
    (c) => ` (nota ${SUPERSCRIPT[c]})`,
  );
  const notes = [...cited, 7].map((n) => `Nota ${n}: ${noteText(n)}`);
  return `${readable.replace(/ \| /g, "; ")}. ${notes.join(" ")}`;
}
