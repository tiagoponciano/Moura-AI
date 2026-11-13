import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table18Json from "../../norms/in-1-p2/tables/table-18.json";
import table19Json from "../../norms/in-1-p2/tables/table-19.json";
import table20Json from "../../norms/in-1-p2/tables/table-20.json";
import table21Json from "../../norms/in-1-p2/tables/table-21.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_I_1_2,
  DIVISION_I_J,
  DIVISION_J_1_2,
  DIVISION_J_3_4,
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
  TABLE_18_NOTES,
  TABLE_19_NOTES,
  TABLE_20_NOTES,
  TABLE_21_NOTES,
  TABLE_2_IJ_NOTES,
} from "./group-ij-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table18 = table18Json as unknown as ExtractedTable;
const table19 = table19Json as unknown as ExtractedTable;
const table20 = table20Json as unknown as ExtractedTable;
const table21 = table21Json as unknown as ExtractedTable;

/** Groups I and J need one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column "I, J e M3", for I and J, for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_IJ_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_I_J, WITHIN_SCOPE] },
  columns: [{ index: 8, label: "I, J e M3", slug: "ij", when: { all: [] } }],
  notes: TABLE_2_IJ_NOTES,
};

const byHeight = HEIGHT_CLASSES.map((height, index) => ({
  index,
  label: height.label,
  slug: height.id,
  when: height.when,
}));

/** Tabela 18, I-1 and I-2. */
export const TABLE_18_SPEC: TableSpec = {
  table: 18,
  base: { all: [REGIME_LARGE, DIVISION_I_1_2, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_18_NOTES,
};

/** Tabela 19, I-3. */
export const TABLE_19_SPEC: TableSpec = {
  table: 19,
  base: { all: [REGIME_LARGE, fact("division", "eq", "I-3"), WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_19_NOTES,
};

/** Tabela 20, J-1 and J-2. */
export const TABLE_20_SPEC: TableSpec = {
  table: 20,
  base: { all: [REGIME_LARGE, DIVISION_J_1_2, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_20_NOTES,
};

/** Tabela 21, J-3 and J-4. */
export const TABLE_21_SPEC: TableSpec = {
  table: 21,
  base: { all: [REGIME_LARGE, DIVISION_J_3_4, WITHIN_SCOPE] },
  columns: byHeight,
  notes: TABLE_21_NOTES,
};

const quadro2 = (rows: string) =>
  `QUADRO 2 - Risco III (relação área e altura): ${rows}`;
const area = (value: number) => fact("area_m2", "lte", value);

/** Risk III for groups I and J, the rows of Quadro 2. */
const RISK_III_IJ: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-I-1-J-1",
    "Risco III, I-1 e J-1",
    33,
    {
      all: [
        fact("division", "in", ["I-1", "J-1"]),
        heightAtMost(21),
        area(5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, I-1, J-1",
    quadro2("I-1, J-1, altura ≤ 21 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-I-2",
    "Risco III, I-2",
    34,
    { all: [fact("division", "eq", "I-2"), heightAtMost(12), area(5000)] },
    "III",
    "Anexo A, Quadro 2, I-2",
    quadro2("I-2, altura ≤ 12 m, área ≤ 5.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-I-3-J-2-low",
    "Risco III, I-3 e J-2 até 6 m",
    35,
    {
      all: [
        fact("division", "in", ["I-3", "J-2"]),
        heightAtMost(6),
        area(4000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, I-3, J-2",
    quadro2("I-3, J-2, altura ≤ 6 m, área ≤ 4.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-I-3-J-2-mid",
    "Risco III, I-3 e J-2 de 6 a 12 m",
    36,
    {
      all: [
        fact("division", "in", ["I-3", "J-2"]),
        heightAbove(6),
        heightAtMost(12),
        area(3000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, I-3, J-2",
    quadro2("I-3, J-2, 6 < altura ≤ 12 m, área ≤ 3.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-J-3",
    "Risco III, J-3",
    37,
    { all: [fact("division", "eq", "J-3"), heightAtMost(6), area(3000)] },
    "III",
    "Anexo A, Quadro 2, J-3",
    quadro2("J-3, altura ≤ 6 m, área ≤ 3.000 m²"),
  ),
  riskRule(
    "IN1P1-RISK-III-J-4",
    "Risco III, J-4",
    38,
    { all: [fact("division", "eq", "J-4"), heightAtMost(6), area(2500)] },
    "III",
    "Anexo A, Quadro 2, J-4",
    quadro2("J-4, altura ≤ 6 m, área ≤ 2.500 m²"),
  ),
];

export const GROUP_IJ_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_IJ_SPEC),
  ...compileTable(table18, TABLE_18_SPEC),
  ...compileTable(table19, TABLE_19_SPEC),
  ...compileTable(table20, TABLE_20_SPEC),
  ...compileTable(table21, TABLE_21_SPEC),
  ...RISK_III_IJ,
];
