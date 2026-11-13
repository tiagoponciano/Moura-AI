import type { Condition, Rule } from "../engine/types";
import table22Json from "../../norms/in-1-p2/tables/table-22.json";
import { compileTable } from "./compile-table";
import { K1, K2, fact, USE_IN_SCOPE } from "./group-c-conditions";
import { TABLE_22_NOTES } from "./group-k-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table22 = table22Json as unknown as ExtractedTable;

/** Grupo K needs one block and one use; it is not split by area or height. */
const WITHIN_SCOPE: Condition = {
  all: [fact("single_block", "eq", true), USE_IN_SCOPE],
};

/** Tabela 22: K-1 by the volume of combustible liquid, K-2 by the type of plant. */
export const TABLE_22_SPEC: TableSpec = {
  table: 22,
  base: WITHIN_SCOPE,
  columns: [
    {
      index: 0,
      label: "K-1, líquido combustível ≤ 20 m³",
      slug: "k1-up-to-20",
      when: { all: [K1, fact("combustible_liquid_m3", "lte", 20)] },
    },
    {
      index: 1,
      label: "K-1, líquido combustível > 20 m³",
      slug: "k1-over-20",
      when: { all: [K1, fact("combustible_liquid_m3", "gt", 20)] },
    },
    {
      index: 2,
      label: "K-2, hidroelétrica",
      slug: "k2-hydro",
      when: { all: [K2, fact("power_plant_type", "eq", "hydro")] },
    },
    {
      index: 3,
      label: "K-2, termoelétrica",
      slug: "k2-thermal",
      when: { all: [K2, fact("power_plant_type", "eq", "thermal")] },
    },
  ],
  notes: TABLE_22_NOTES,
};

export const GROUP_K_RULES: Rule[] = compileTable(table22, TABLE_22_SPEC);
