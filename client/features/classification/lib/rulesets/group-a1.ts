import type { Rule } from "../engine/types";
import table3Json from "../../norms/in-1-p2/tables/table-03.json";
import { compileTable } from "./compile-table";
import { guard } from "./group-c";
import { A1, fact } from "./group-c-conditions";
import { TABLE_3_A1_NOTES } from "./group-a1-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table3 = table3Json as unknown as ExtractedTable;

const construction = (value: string) => fact("a1_construction", "eq", value);

/** The A-1 grid of Tabela 3: three columns by how the dwelling is built, whatever its area or height. */
export const TABLE_3_A1_SPEC: TableSpec = {
  table: 3,
  part: 0,
  base: A1,
  columns: [
    {
      index: 0,
      label: "Geminada/conjugada",
      slug: "a1-attached",
      when: construction("attached"),
    },
    {
      index: 1,
      label: "Isolada",
      slug: "a1-detached",
      when: construction("detached"),
    },
    {
      index: 2,
      label: "Unifamiliar mista, H < 6 m",
      slug: "a1-mixed",
      when: {
        all: [construction("mixed_single_family"), fact("height_m", "lt", 6)],
      },
    },
  ],
  notes: TABLE_3_A1_NOTES,
};

const GUARDS: Rule[] = [
  guard(
    "GUARD-a1-mixed-over-6m",
    "Unifamiliar mista acima de 6 m",
    {
      all: [
        A1,
        construction("mixed_single_family"),
        fact("height_m", "gte", 6),
      ],
    },
    "Unidade unifamiliar em edificação mista com 6 m ou mais: deve atender à Tabela 2 ou 3 (como A-2) ou à ocupação predominante, a que for mais rigorosa. Análise específica.",
    {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabela 3, nota 13",
      quote:
        "a unidade unifamiliar em edificações mistas, quando situada em altura superior a 6 m, deve atender às exigências da tabela 2 ou 3 (assemelhando-se a A-2) ou da ocupação predominante, a que for mais rigorosa",
    },
  ),
];

export const GROUP_A1_RULES: Rule[] = [
  ...GUARDS,
  ...compileTable(table3, TABLE_3_A1_SPEC),
];
