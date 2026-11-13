import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table7Json from "../../norms/in-1-p2/tables/table-07.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_E,
  DIVISION_E_1_4,
  DIVISION_E_5_6,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
  heightAtMost,
  USE_IN_SCOPE,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import { TABLE_2_E_NOTES, TABLE_7_NOTES } from "./group-e-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table7 = table7Json as unknown as ExtractedTable;

/** Grupo E needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column "A-2, A-3, D, E e G", for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_E_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_E, WITHIN_SCOPE] },
  columns: [
    { index: 0, label: "A-2, A-3, D, E e G", slug: "e", when: { all: [] } },
  ],
  notes: TABLE_2_E_NOTES,
};

/** Tabela 7, Grupo E, for area ≥ 750 m² or height ≥ 12 m, one column per height class. */
export const TABLE_7_SPEC: TableSpec = {
  table: 7,
  base: { all: [REGIME_LARGE, DIVISION_E, WITHIN_SCOPE] },
  columns: HEIGHT_CLASSES.map((height, index) => ({
    index,
    label: height.label,
    slug: height.id,
    when: height.when,
  })),
  notes: TABLE_7_NOTES,
};

/** Risk III for Grupo E, the two rows of Quadro 2. */
const RISK_III_E: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-E-1-4",
    "Risco III, E-1 a E-4",
    61,
    {
      all: [DIVISION_E_1_4, heightAtMost(21), fact("area_m2", "lte", 5000)],
    },
    "III",
    "Anexo A, Quadro 2, E-1, E-2, E-3, E-4",
    "QUADRO 2 - Risco III (relação área e altura): E, E-1, E-2, E-3, E-4, altura ≤ 21 m, área ≤ 5.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-E-5-6",
    "Risco III, E-5 e E-6",
    62,
    {
      all: [DIVISION_E_5_6, heightAtMost(12), fact("area_m2", "lte", 750)],
    },
    "III",
    "Anexo A, Quadro 2, E-5, E-6",
    "QUADRO 2 - Risco III (relação área e altura): E, E-5, E-6, altura ≤ 12 m, área ≤ 750 m²",
  ),
];

export const GROUP_E_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_E_SPEC),
  ...compileTable(table7, TABLE_7_SPEC),
  ...RISK_III_E,
];
