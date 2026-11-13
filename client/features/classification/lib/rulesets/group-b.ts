import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table4Json from "../../norms/in-1-p2/tables/table-04.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_B,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
  heightAbove,
  heightAtMost,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import { TABLE_2_B_NOTES, TABLE_4_NOTES } from "./group-b-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table4 = table4Json as unknown as ExtractedTable;

/** Grupo B needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), fact("single_use", "eq", true)],
};

/** Tabela 2, column B, for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_B_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_B, WITHIN_SCOPE] },
  columns: [{ index: 1, label: "B", slug: "b", when: { all: [] } }],
  notes: TABLE_2_B_NOTES,
};

/** The columns of Tabela 4: it has five, and one covers 12 to 30 m. */
const [ground, upTo6, upTo12, , , above30] = HEIGHT_CLASSES;
const TABLE_4_COLUMNS = [
  { index: 0, label: ground.label, slug: ground.id, when: ground.when },
  { index: 1, label: upTo6.label, slug: upTo6.id, when: upTo6.when },
  { index: 2, label: upTo12.label, slug: upTo12.id, when: upTo12.when },
  {
    index: 3,
    label: "12 < H ≤ 30",
    slug: "h12_30",
    when: { all: [heightAbove(12), heightAtMost(30)] } as Condition,
  },
  { index: 4, label: above30.label, slug: above30.id, when: above30.when },
];

/** Tabela 4, Grupo B, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_4_SPEC: TableSpec = {
  table: 4,
  base: { all: [REGIME_LARGE, DIVISION_B, WITHIN_SCOPE] },
  columns: TABLE_4_COLUMNS,
  notes: TABLE_4_NOTES,
};

const quadro2 = (rows: string) =>
  `QUADRO 2 - Risco III (relação área e altura): B, B-1, B-2, ${rows}`;

/** Risk III for Grupo B, the two rows of Quadro 2. */
const RISK_III_B: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-B-low",
    "Risco III, B até 6 m",
    81,
    { all: [DIVISION_B, heightAtMost(6), fact("area_m2", "lte", 5000)] },
    "III",
    "Anexo A, Quadro 2, B-1, B-2",
    quadro2("altura ≤ 6 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-B-mid",
    "Risco III, B de 6 a 12 m",
    82,
    {
      all: [
        DIVISION_B,
        heightAbove(6),
        heightAtMost(12),
        fact("area_m2", "lte", 4000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, B-1, B-2",
    quadro2("6 < h ≤ 12 m, área ≤ 4.000 m²"),
  ),
];

export const GROUP_B_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_B_SPEC),
  ...compileTable(table4, TABLE_4_SPEC),
  ...RISK_III_B,
];
