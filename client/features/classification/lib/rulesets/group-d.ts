import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table6Json from "../../norms/in-1-p2/tables/table-06.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_D,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
  heightAbove,
  heightAtMost,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import { TABLE_2_D_NOTES, TABLE_6_NOTES } from "./group-d-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table6 = table6Json as unknown as ExtractedTable;

/** Grupo D needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), fact("single_use", "eq", true)],
};

/** Tabela 2, column "A-2, A-3, D, E e G", for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_D_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_D, WITHIN_SCOPE] },
  columns: [
    { index: 0, label: "A-2, A-3, D, E e G", slug: "d", when: { all: [] } },
  ],
  notes: TABLE_2_D_NOTES,
};

/** Tabela 6, Grupo D, for area ≥ 750 m² or height ≥ 12 m, one column per height class. */
export const TABLE_6_SPEC: TableSpec = {
  table: 6,
  base: { all: [REGIME_LARGE, DIVISION_D, WITHIN_SCOPE] },
  columns: HEIGHT_CLASSES.map((height, index) => ({
    index,
    label: height.label,
    slug: height.id,
    when: height.when,
  })),
  notes: TABLE_6_NOTES,
};

const quadro2 = (rows: string) =>
  `QUADRO 2 - Risco III (relação área e altura): D, Todas, ${rows}`;

/** Risk III for Grupo D, the three rows of Quadro 2. */
const RISK_III_D: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-D-low",
    "Risco III, D até 6 m",
    51,
    { all: [DIVISION_D, heightAtMost(6), fact("area_m2", "lte", 5000)] },
    "III",
    "Anexo A, Quadro 2, D",
    quadro2("altura ≤ 6 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-D-mid",
    "Risco III, D de 6 a 12 m",
    52,
    {
      all: [
        DIVISION_D,
        heightAbove(6),
        heightAtMost(12),
        fact("area_m2", "lte", 3000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, D",
    quadro2("6 < h ≤ 12 m, área ≤ 3.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-D-high",
    "Risco III, D de 12 a 21 m",
    53,
    {
      all: [
        DIVISION_D,
        heightAbove(12),
        heightAtMost(21),
        fact("area_m2", "lte", 2000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, D",
    quadro2("12 < h ≤ 21 m, área ≤ 2.000 m²"),
  ),
];

export const GROUP_D_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_D_SPEC),
  ...compileTable(table6, TABLE_6_SPEC),
  ...RISK_III_D,
];
