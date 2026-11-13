import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table8Json from "../../norms/in-1-p2/tables/table-08.json";
import table9Json from "../../norms/in-1-p2/tables/table-09.json";
import table10Json from "../../norms/in-1-p2/tables/table-10.json";
import table11Json from "../../norms/in-1-p2/tables/table-11.json";
import table12Json from "../../norms/in-1-p2/tables/table-12.json";
import { compileTable } from "./compile-table";
import {
  DIVISION_F,
  DIVISION_F_1_2,
  DIVISION_F_3_9,
  DIVISION_F_5_6_8_10,
  DIVISION_F_MAIN,
  HEIGHT_CLASSES,
  REGIME_LARGE,
  REGIME_SMALL,
  USE_IN_SCOPE,
  fact,
} from "./group-c-conditions";
import { riskRule } from "./group-c-risk";
import {
  TABLE_10_NOTES,
  TABLE_11_NOTES,
  TABLE_12_NOTES,
  TABLE_2_F_NOTES,
  TABLE_8_NOTES,
  TABLE_9_NOTES,
} from "./group-f-notes";
import type { ExtractedTable, TableSpec } from "./types";

const t = (json: unknown) => json as ExtractedTable;
const table2 = t(table2Json);

/** Grupo F needs one block and one use; the storage rule belongs to Grupo C. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};
const small = (division: Condition): Condition => ({
  all: [REGIME_SMALL, division, WITHIN_SCOPE],
});
const large = (division: Condition): Condition => ({
  all: [REGIME_LARGE, division, WITHIN_SCOPE],
});
const always: Condition = { all: [] };

/** Tabela 2, column "F1 a F6, F8 e F10", for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_F_MAIN_SPEC: TableSpec = {
  table: 2,
  base: small(DIVISION_F_MAIN),
  columns: [
    { index: 3, label: "F1 a F6, F8 e F10", slug: "f-main", when: always },
  ],
  notes: TABLE_2_F_NOTES,
};

/** Tabela 2, column F9. */
export const TABLE_2_F9_SPEC: TableSpec = {
  table: 2,
  base: small(fact("division", "eq", "F-9")),
  columns: [{ index: 4, label: "F9", slug: "f9", when: always }],
  notes: TABLE_2_F_NOTES,
};

/** Tabela 2, column F11. */
export const TABLE_2_F11_SPEC: TableSpec = {
  table: 2,
  base: small(fact("division", "eq", "F-11")),
  columns: [{ index: 5, label: "F11", slug: "f11", when: always }],
  notes: TABLE_2_F_NOTES,
};

const byHeight = HEIGHT_CLASSES.map((height, index) => ({
  index,
  label: height.label,
  slug: height.id,
  when: height.when,
}));

export const TABLE_8_SPEC: TableSpec = {
  table: 8,
  base: large(DIVISION_F_1_2),
  columns: byHeight,
  notes: TABLE_8_NOTES,
};
export const TABLE_9_SPEC: TableSpec = {
  table: 9,
  base: large(DIVISION_F_3_9),
  columns: byHeight,
  notes: TABLE_9_NOTES,
};
export const TABLE_10_SPEC: TableSpec = {
  table: 10,
  base: large(DIVISION_F_5_6_8_10),
  columns: byHeight,
  notes: TABLE_10_NOTES,
};
export const TABLE_11_SPEC: TableSpec = {
  table: 11,
  base: large(fact("division", "eq", "F-4")),
  columns: byHeight,
  notes: TABLE_11_NOTES,
};
export const TABLE_12_SPEC: TableSpec = {
  table: 12,
  base: large(fact("division", "eq", "F-11")),
  columns: byHeight,
  notes: TABLE_12_NOTES,
};

/** Risk III for Grupo F, Quadro 3: no relation between area and height. */
const RISK_III_F: Rule[] = [
  riskRule(
    "IN1P1-RISK-III-F",
    "Risco III, Grupo F",
    39,
    { all: [DIVISION_F, fact("capacity_people", "lte", 200)] },
    "III",
    "Anexo A, Quadro 3, F",
    "QUADRO 3 - Risco III (sem relação área e altura): F, todas, aqueles não enquadrados no risco II mas que ainda possuam população ≤ 200 pessoas (em cada área de reunião de público)",
  ),
];

export const GROUP_F_RULES: Rule[] = [
  ...compileTable(table2, TABLE_2_F_MAIN_SPEC),
  ...compileTable(table2, TABLE_2_F9_SPEC),
  ...compileTable(table2, TABLE_2_F11_SPEC),
  ...compileTable(t(table8Json), TABLE_8_SPEC),
  ...compileTable(t(table9Json), TABLE_9_SPEC),
  ...compileTable(t(table10Json), TABLE_10_SPEC),
  ...compileTable(t(table11Json), TABLE_11_SPEC),
  ...compileTable(t(table12Json), TABLE_12_SPEC),
  ...RISK_III_F,
];
