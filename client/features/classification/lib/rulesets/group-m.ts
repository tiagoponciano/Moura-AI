import type { Condition, Rule } from "../engine/types";
import table23Json from "../../norms/in-1-p2/tables/table-23.json";
import table24Json from "../../norms/in-1-p2/tables/table-24.json";
import { compileTable } from "./compile-table";
import { M1, M2, fact, USE_IN_SCOPE } from "./group-c-conditions";
import { TABLE_23_NOTES, TABLE_24_NOTES } from "./group-m-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table23 = table23Json as unknown as ExtractedTable;
const table24 = table24Json as unknown as ExtractedTable;

/** Grupo M needs one block and one use; M-1 and M-2 do not depend on area or height. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

const length = (op: "lte" | "gt", value: number) =>
  fact("tunnel_length_m", op, value);

/** Tabela 23: the length of the tunnel, in four columns. */
export const TABLE_23_SPEC: TableSpec = {
  table: 23,
  base: WITHIN_SCOPE,
  columns: [
    {
      index: 0,
      label: "≤ 200 m",
      slug: "up-to-200",
      when: { all: [M1, length("lte", 200)] },
    },
    {
      index: 1,
      label: "200 a 500 m",
      slug: "200-500",
      when: { all: [M1, length("gt", 200), length("lte", 500)] },
    },
    {
      index: 2,
      label: "500 a 1.000 m",
      slug: "500-1000",
      when: { all: [M1, length("gt", 500), length("lte", 1000)] },
    },
    {
      index: 3,
      label: "> 1.000 m",
      slug: "over-1000",
      when: { all: [M1, length("gt", 1000)] },
    },
  ],
  notes: TABLE_23_NOTES,
};

const installation = (value: string) => fact("m2_installation", "eq", value);
const within = (gasLimit: number): Condition => ({
  all: [
    fact("m2_liquid_m3", "lte", 20),
    fact("m2_gas_quantity", "lte", gasLimit),
  ],
});
const above = (gasLimit: number): Condition => ({
  any: [
    fact("m2_liquid_m3", "gt", 20),
    fact("m2_gas_quantity", "gt", gasLimit),
  ],
});

/** Tabela 24: M-2 by installation and by the quantity of liquids or gases. */
export const TABLE_24_SPEC: TableSpec = {
  table: 24,
  base: { all: [WITHIN_SCOPE, M2] },
  columns: [
    {
      index: 0,
      label:
        "tanques, cilindros e processos, líquidos até 20 m³ ou gases até 10 m³",
      slug: "tanks-small",
      when: { all: [installation("tanks_processes"), within(10)] },
    },
    {
      index: 1,
      label:
        "tanques, cilindros e processos, líquidos acima de 20 m³ ou gases acima de 10 m³",
      slug: "tanks-large",
      when: { all: [installation("tanks_processes"), above(10)] },
    },
    {
      index: 2,
      label: "plataforma de carregamento/descarregamento",
      slug: "platform",
      when: installation("loading_platform"),
    },
    {
      index: 3,
      label:
        "produtos acondicionados, líquidos até 20 m³ ou gases até 12.480 kg",
      slug: "packaged-small",
      when: { all: [installation("packaged_products"), within(12480)] },
    },
    {
      index: 4,
      label:
        "produtos acondicionados, líquidos acima de 20 m³ ou gases acima de 12.480 kg",
      slug: "packaged-large",
      when: { all: [installation("packaged_products"), above(12480)] },
    },
  ],
  notes: TABLE_24_NOTES,
};

export const GROUP_M_RULES: Rule[] = [
  ...compileTable(table23, TABLE_23_SPEC),
  ...compileTable(table24, TABLE_24_SPEC),
];
