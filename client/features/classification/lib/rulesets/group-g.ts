import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table13Json from "../../norms/in-1-p2/tables/table-13.json";
import table14Json from "../../norms/in-1-p2/tables/table-14.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_G,
  DIVISION_G_1_2_5,
  DIVISION_G_3_4,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
  heightAbove,
  heightAtMost,
  USE_IN_SCOPE,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import {
  TABLE_13_NOTES,
  TABLE_14_NOTES,
  TABLE_2_G_NOTES,
} from "./group-g-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table13 = table13Json as unknown as ExtractedTable;
const table14 = table14Json as unknown as ExtractedTable;

/** Grupo G needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column "A-2, A-3, D, E e G", for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_G_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_G, WITHIN_SCOPE] },
  columns: [
    { index: 0, label: "A-2, A-3, D, E e G", slug: "g", when: { all: [] } },
  ],
  notes: TABLE_2_G_NOTES,
};

const byHeight = HEIGHT_CLASSES.map((height, index) => ({
  index,
  label: height.label,
  slug: height.id,
  when: height.when,
}));

/** Tabela 13, G-1, G-2 and G-5, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_13_SPEC: TableSpec = {
  table: 13,
  base: { all: [REGIME_LARGE, DIVISION_G_1_2_5, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_13_NOTES,
};

/** Tabela 14, G-3 and G-4, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_14_SPEC: TableSpec = {
  table: 14,
  base: { all: [REGIME_LARGE, DIVISION_G_3_4, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_14_NOTES,
};

const quadro2 = (rows: string) =>
  `QUADRO 2 - Risco III (relação área e altura): G, ${rows}`;

/** Risk III for Grupo G, the rows of Quadro 2. */
const RISK_III_G: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-G-1-2-5",
    "Risco III, G-1, G-2 e G-5",
    71,
    {
      all: [DIVISION_G_1_2_5, heightAtMost(21), fact("area_m2", "lte", 5000)],
    },
    "III",
    "Anexo A, Quadro 2, G-1, G-2, G-5",
    quadro2("G-1, G-2, G-5, altura ≤ 21 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-G-3",
    "Risco III, G-3 térreo",
    72,
    {
      all: [
        fact("division", "eq", "G-3"),
        fact("storeys", "eq", 1),
        fact("area_m2", "lte", 750),
      ],
    },
    "III",
    "Anexo A, Quadro 2, G-3",
    quadro2("G-3, TÉRREO, área ≤ 750 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-G-4-low",
    "Risco III, G-4 até 6 m",
    73,
    {
      all: [
        fact("division", "eq", "G-4"),
        heightAtMost(6),
        fact("area_m2", "lte", 5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, G-4",
    quadro2("G-4, altura ≤ 6 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-G-4-mid",
    "Risco III, G-4 de 6 a 12 m",
    74,
    {
      all: [
        fact("division", "eq", "G-4"),
        heightAbove(6),
        heightAtMost(12),
        fact("area_m2", "lte", 3000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, G-4",
    quadro2("G-4, 6 < h ≤ 12 m, área ≤ 3.000 m²"),
  ),
];

export const GROUP_G_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_G_SPEC),
  ...compileTable(table13, TABLE_13_SPEC),
  ...compileTable(table14, TABLE_14_SPEC),
  ...RISK_III_G,
];
