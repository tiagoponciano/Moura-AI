import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table15Json from "../../norms/in-1-p2/tables/table-15.json";
import table16Json from "../../norms/in-1-p2/tables/table-16.json";
import table17Json from "../../norms/in-1-p2/tables/table-17.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_H_1_2_6,
  DIVISION_H_1_4_6,
  DIVISION_H_2_3_5,
  DIVISION_H_4_5,
  H2,
  H3,
  H6,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  USE_IN_SCOPE,
  fact,
  heightAbove,
  heightAtMost,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import {
  TABLE_15_NOTES,
  TABLE_16_NOTES,
  TABLE_17_NOTES,
  TABLE_2_H_NOTES,
} from "./group-h-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table15 = table15Json as unknown as ExtractedTable;
const table16 = table16Json as unknown as ExtractedTable;
const table17 = table17Json as unknown as ExtractedTable;

/** Grupo H needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column H-1, H-4 and H-6, for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_H146_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_H_1_4_6, WITHIN_SCOPE] },
  columns: [
    { index: 6, label: "H1, H4 e H6", slug: "h146", when: { all: [] } },
  ],
  notes: TABLE_2_H_NOTES,
};

/** Tabela 2, column H-2, H-3 and H-5, for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_H235_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_H_2_3_5, WITHIN_SCOPE] },
  columns: [
    { index: 7, label: "H2, H3 e H5", slug: "h235", when: { all: [] } },
  ],
  notes: TABLE_2_H_NOTES,
};

const byHeight = HEIGHT_CLASSES.map((height, index) => ({
  index,
  label: height.label,
  slug: height.id,
  when: height.when,
}));

/** Tabela 15, H-1, H-2 and H-6, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_15_SPEC: TableSpec = {
  table: 15,
  base: { all: [REGIME_LARGE, DIVISION_H_1_2_6, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_15_NOTES,
};

/** Tabela 16, H-3, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_16_SPEC: TableSpec = {
  table: 16,
  base: { all: [REGIME_LARGE, H3, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_16_NOTES,
};

/** Tabela 17, H-4 and H-5, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_17_SPEC: TableSpec = {
  table: 17,
  base: { all: [REGIME_LARGE, DIVISION_H_4_5, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_17_NOTES,
};

const quadro2 = (rows: string) =>
  `QUADRO 2 - Risco III (relação área e altura): H, ${rows}`;

/** Risk III for Grupo H, the rows of Quadro 2. */
const RISK_III_H: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-H-1-4",
    "Risco III, H-1 e H-4",
    46,
    {
      all: [
        fact("division", "in", ["H-1", "H-4"]),
        heightAtMost(21),
        fact("area_m2", "lte", 5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, H-1, H-4",
    quadro2("H-1, H-4, altura ≤ 21 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-H-2",
    "Risco III, H-2",
    47,
    { all: [H2, heightAtMost(12), fact("area_m2", "lte", 5000)] },
    "III",
    "Anexo A, Quadro 2, H-2",
    quadro2("H-2, altura ≤ 12 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-H-3-5",
    "Risco III, H-3 e H-5",
    48,
    {
      all: [
        fact("division", "in", ["H-3", "H-5"]),
        heightAtMost(6),
        fact("area_m2", "lte", 750),
      ],
    },
    "III",
    "Anexo A, Quadro 2, H-3, H-5",
    quadro2("H-3, H-5, altura ≤ 6 m, área ≤ 750 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-H-6-low",
    "Risco III, H-6 até 6 m",
    49,
    { all: [H6, heightAtMost(6), fact("area_m2", "lte", 5000)] },
    "III",
    "Anexo A, Quadro 2, H-6",
    quadro2("H-6, altura ≤ 6 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-H-6-mid",
    "Risco III, H-6 de 6 a 12 m",
    50,
    {
      all: [H6, heightAbove(6), heightAtMost(12), fact("area_m2", "lte", 2500)],
    },
    "III",
    "Anexo A, Quadro 2, H-6",
    quadro2("H-6, 6 < h ≤ 12 m, área ≤ 2.500 m²"),
  ),
];

export const GROUP_H_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_H146_SPEC),
  ...compileTable(table2, TABLE_2_H235_SPEC),
  ...compileTable(table15, TABLE_15_SPEC),
  ...compileTable(table16, TABLE_16_SPEC),
  ...compileTable(table17, TABLE_17_SPEC),
  ...RISK_III_H,
];
