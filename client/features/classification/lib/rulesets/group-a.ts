import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table3Json from "../../norms/in-1-p2/tables/table-03.json";
import { compileTable } from "./compile-table";
import {
  A3,
  DIVISION_A_2_3,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
  heightAbove,
  heightAtMost,
  USE_IN_SCOPE,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import { TABLE_2_A_NOTES, TABLE_3_A23_NOTES } from "./group-a-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table3 = table3Json as unknown as ExtractedTable;

/** A-2 and A-3 need one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column "A-2, A-3, D, E e G", for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_A_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_A_2_3, WITHIN_SCOPE] },
  columns: [
    { index: 0, label: "A-2, A-3, D, E e G", slug: "a", when: { all: [] } },
  ],
  notes: TABLE_2_A_NOTES,
};

/** The columns of the A-2 and A-3 grid of Tabela 3: it splits at 6, 15 and 30 m. */
const [ground, upTo6] = HEIGHT_CLASSES;
const TABLE_3_COLUMNS = [
  { index: 0, label: ground.label, slug: ground.id, when: ground.when },
  { index: 1, label: upTo6.label, slug: upTo6.id, when: upTo6.when },
  {
    index: 2,
    label: "6 < H ≤ 15",
    slug: "h6_15",
    when: { all: [heightAbove(6), heightAtMost(15)] } as Condition,
  },
  {
    index: 3,
    label: "15 < H ≤ 30",
    slug: "h15_30",
    when: { all: [heightAbove(15), heightAtMost(30)] } as Condition,
  },
  {
    index: 4,
    label: "> 30",
    slug: "h30p",
    when: heightAbove(30),
  },
];

/** Tabela 3, the A-2 and A-3 grid, for area ≥ 750 m² or height ≥ 12 m. */
export const TABLE_3_A23_SPEC: TableSpec = {
  table: 3,
  part: 1,
  base: { all: [REGIME_LARGE, DIVISION_A_2_3, WITHIN_SCOPE] },
  columns: TABLE_3_COLUMNS,
  notes: TABLE_3_A23_NOTES,
};

/** Risk III for A-2 and A-3, the rows of Quadro 2. */
const RISK_III_A: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-A-2",
    "Risco III, A-1 e A-2",
    85,
    {
      all: [
        fact("division", "in", ["A-1", "A-2"]),
        heightAtMost(21),
        fact("area_m2", "lte", 5000),
      ],
    },
    "III",
    "Anexo A, Quadro 2, A-1, A-2",
    "QUADRO 2 - Risco III (relação área e altura): A, A-1, A-2, altura ≤ 21 m, área ≤ 5.000 m²",
  ),
  riskRule(
    "IN1P1-RISK-III-A-3",
    "Risco III, A-3",
    86,
    { all: [A3, heightAtMost(21), fact("area_m2", "lte", 2500)] },
    "III",
    "Anexo A, Quadro 2, A-3",
    "QUADRO 2 - Risco III (relação área e altura): A, A-3, altura ≤ 21 m, área ≤ 2.500 m²",
  ),
];

export const GROUP_A_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_A_SPEC),
  ...compileTable(table3, TABLE_3_A23_SPEC),
  ...RISK_III_A,
];
