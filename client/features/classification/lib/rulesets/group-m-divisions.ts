import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table25Json from "../../norms/in-1-p2/tables/table-25.json";
import table26Json from "../../norms/in-1-p2/tables/table-26.json";
import table27Json from "../../norms/in-1-p2/tables/table-27.json";
import table28Json from "../../norms/in-1-p2/tables/table-28.json";
import table29Json from "../../norms/in-1-p2/tables/table-29.json";
import { compileTable } from "./compile-table";
import { guard } from "./group-c";
import {
  HEIGHT_CLASSES,
  M3,
  M4,
  M5,
  M6,
  M7,
  M11,
  REGIME_LARGE,
  REGIME_SMALL,
  USE_IN_SCOPE,
  fact,
} from "./group-c-conditions";
import { TABLE_2_IJ_NOTES } from "./group-ij-notes";
import {
  TABLE_25_NOTES,
  TABLE_26_NOTES,
  TABLE_27_NOTES,
  TABLE_28_NOTES,
  TABLE_29_NOTES,
} from "./group-m-divisions-notes";
import type { ExtractedTable, TableSpec } from "./types";

const t = (json: unknown) => json as ExtractedTable;

/** These divisions need one block and one use. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 2, column "I, J e M3", for M-3 with area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_M3_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, M3, WITHIN_SCOPE] },
  columns: [{ index: 8, label: "I, J e M3", slug: "m3", when: { all: [] } }],
  notes: TABLE_2_IJ_NOTES,
};

/** Tabela 25, M-3 with area ≥ 750 m² or height ≥ 12 m, one column per height class. */
export const TABLE_25_SPEC: TableSpec = {
  table: 25,
  base: { all: [REGIME_LARGE, M3, WITHIN_SCOPE] },
  columns: HEIGHT_CLASSES.map((height, index) => ({
    index,
    label: height.label,
    slug: height.id,
    when: height.when,
  })),
  notes: TABLE_25_NOTES,
};

/** Tabela 26: M-4 above 1.500 m² and M-7 (térreo, áreas externas). */
export const TABLE_26_SPEC: TableSpec = {
  table: 26,
  base: WITHIN_SCOPE,
  columns: [
    {
      index: 0,
      label: "M-4 (acima de 1.500 m²)",
      slug: "m4",
      when: { all: [M4, fact("area_m2", "gt", 1500)] },
    },
    { index: 1, label: "M-7", slug: "m7", when: M7 },
  ],
  notes: TABLE_26_NOTES,
};

/** Tabela 27: M-5, any area. */
export const TABLE_27_SPEC: TableSpec = {
  table: 27,
  base: { all: [WITHIN_SCOPE, M5] },
  columns: [
    { index: 0, label: "Qualquer área", slug: "m5", when: { all: [] } },
  ],
  notes: TABLE_27_NOTES,
};

/** Tabela 28: M-6, planted area above 500 ha. */
export const TABLE_28_SPEC: TableSpec = {
  table: 28,
  base: { all: [WITHIN_SCOPE, M6] },
  columns: [
    {
      index: 0,
      label: "Área de plantio > 500 ha",
      slug: "m6",
      when: fact("planting_area_ha", "gt", 500),
    },
  ],
  notes: TABLE_28_NOTES,
};

/** Tabela 29: M-11 (greenhouses) by area. */
export const TABLE_29_SPEC: TableSpec = {
  table: 29,
  base: { all: [WITHIN_SCOPE, M11] },
  columns: [
    {
      index: 0,
      label: "< 750 m²",
      slug: "m11-small",
      when: fact("area_m2", "lt", 750),
    },
    {
      index: 1,
      label: "≥ 750 m²",
      slug: "m11-large",
      when: fact("area_m2", "gte", 750),
    },
  ],
  notes: TABLE_29_NOTES,
};

/** What the tables leave out: M-4 up to 1.500 m² and M-6 up to 500 ha. */
const GUARDS: Rule[] = [
  guard(
    "GUARD-m4-up-to-1500",
    "M-4 até 1.500 m²",
    { all: [M4, fact("area_m2", "lte", 1500)] },
    "A Tabela 26 só traz as exigências de M-4 acima de 1.500 m²; abaixo disso a norma não diz. Análise específica.",
    {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabela 26",
      quote: "M-4 (acima de 1.500 m²)",
    },
  ),
  guard(
    "GUARD-m6-up-to-500ha",
    "M-6 até 500 ha",
    { all: [M6, fact("planting_area_ha", "lte", 500)] },
    "A Tabela 28 só traz as exigências de M-6 com área de plantio acima de 500 ha; abaixo disso a norma não diz. Análise específica.",
    {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabela 28",
      quote: "Área de plantio > 500 ha",
    },
  ),
];

export const GROUP_M_DIVISIONS_RULES: Rule[] = [
  ...GUARDS,
  ...compileTable(t(table2Json), TABLE_2_M3_SPEC),
  ...compileTable(t(table25Json), TABLE_25_SPEC),
  ...compileTable(t(table26Json), TABLE_26_SPEC),
  ...compileTable(t(table27Json), TABLE_27_SPEC),
  ...compileTable(t(table28Json), TABLE_28_SPEC),
  ...compileTable(t(table29Json), TABLE_29_SPEC),
];
