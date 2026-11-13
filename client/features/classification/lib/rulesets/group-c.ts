import type { Condition, Rule } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table5Json from "../../norms/in-1-p2/tables/table-05.json";
import { compileTable, NORM_VALID_FROM } from "./compile-table";
import { GROUP_C_RISK_RULES } from "./group-c-risk";
import {
  COVERED_DIVISIONS,
  DIVISION_C,
  FIRE_LOAD_CLASSES,
  HEIGHT_CLASSES,
  REGIME_BOUNDARY,
  REGIME_LARGE,
  REGIME_SMALL,
  fact,
} from "./group-c-conditions";
import { TABLE_2_NOTES, TABLE_5_NOTES } from "./group-c-notes";
import type { ExtractedTable, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table5 = table5Json as unknown as ExtractedTable;

/** Facts every Grupo C table needs besides area, height and division. */
const WITHIN_SCOPE: Condition = {
  all: [
    fact("single_block", "eq", true),
    fact("single_use", "eq", true),
    fact("storage_over_3_5m", "eq", false),
  ],
};

/** Tabela 2, column C (the whole group), for area ≤ 750 m² and height ≤ 12 m. */
export const TABLE_2_SPEC: TableSpec = {
  table: 2,
  base: { all: [REGIME_SMALL, DIVISION_C, WITHIN_SCOPE] },
  columns: [{ index: 2, label: "C", slug: "c", when: { all: [] } }],
  notes: TABLE_2_NOTES,
};

/** Tabela 5, Grupo C, for area ≥ 750 m² or height ≥ 12 m, one column per height class. */
export const TABLE_5_SPEC: TableSpec = {
  table: 5,
  base: { all: [REGIME_LARGE, DIVISION_C, WITHIN_SCOPE] },
  columns: HEIGHT_CLASSES.map((height, index) => ({
    index,
    label: height.label,
    slug: height.id,
    when: height.when,
  })),
  notes: TABLE_5_NOTES,
};

const base = {
  version: "1",
  validFrom: NORM_VALID_FROM,
  status: "provisional" as const,
};

const deriveFireLoadClass: Rule[] = FIRE_LOAD_CLASSES.map((cls, i) => ({
  ...base,
  id: `IN3-FIRE-LOAD-${cls.id}`,
  name: `Carga de incêndio ${cls.label.toLowerCase()}`,
  stage: "derive",
  priority: i + 1,
  when: cls.when,
  then: { set: { fact: "fire_load_class", value: cls.id } },
  source: {
    doc: "IN-3",
    locator: "Art. 11",
    quote:
      "I-Carga de incêndio desprezível: qfi≤100; II-baixa: 100<qfi≤300; III-média: 300<qfi≤1200; IV-alta: 1200<qfi≤2280; V-altíssima: qfi>2280 (MJ/m²)",
  },
}));

/** Which table applies and which column, shown on screen. The tables' own conditions use the same helpers. */
const deriveRegime: Rule[] = [
  {
    ...base,
    id: "IN1P2-REGIME-small",
    name: "Imóvel até 750 m² e 12 m",
    stage: "derive",
    priority: 1,
    when: REGIME_SMALL,
    then: { set: { fact: "regime", value: "small" } },
    source: {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabela 2",
      quote: `TABELA 2 - ${table2.title}`,
    },
  },
  {
    ...base,
    id: "IN1P2-REGIME-large",
    name: "Imóvel acima de 750 m² ou 12 m",
    stage: "derive",
    priority: 2,
    when: REGIME_LARGE,
    then: { set: { fact: "regime", value: "large" } },
    source: {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabelas 3 a 29",
      quote: `TABELA 5 - ${table5.title}`,
    },
  },
];

const deriveHeightClass: Rule[] = HEIGHT_CLASSES.map((height, i) => ({
  ...base,
  id: `IN1P2-HEIGHT-${height.id}`,
  name: `Coluna de altura ${height.label}`,
  stage: "derive",
  priority: i + 1,
  when: height.when,
  then: { set: { fact: "height_class", value: height.id } },
  source: {
    doc: "IN-1-P2",
    locator: "Art. 8º, inciso V; Anexo B, Tabela 5",
    quote:
      "V - edificações térreas possuem altura 0 (zero) para fins de exigência de SMSCI.",
  },
}));

const guard = (
  id: string,
  name: string,
  when: Condition,
  reason: string,
  source: Rule["source"],
): Rule => ({
  ...base,
  id,
  name,
  stage: "systems",
  priority: 1,
  when,
  then: { specificAnalysis: reason },
  source,
});

/** Cases the Grupo C tables do not settle: the engine says so instead of listing systems. */
const guards: Rule[] = [
  guard(
    "GUARD-not-covered",
    "Divisão sem regras carregadas",
    { not: COVERED_DIVISIONS },
    "Esta divisão ainda não está coberta: só os Grupos C (comércio), D (serviços profissionais), E (educacional) e G (serviços automotivos) têm regras carregadas.",
    { doc: "IN-1-P2", locator: "Anexo B" },
  ),
  guard(
    "GUARD-boundary",
    "Exatamente 750 m² ou 12 m",
    { all: [COVERED_DIVISIONS, REGIME_BOUNDARY] },
    "Exatamente 750 m² (com altura até 12 m) ou exatamente 12 m (com área até 750 m²): a Tabela 2 e as tabelas por altura valem ao mesmo tempo, e a norma não diz qual prevalece. Análise específica.",
    {
      doc: "IN-1-P2",
      locator: "Anexo B, Tabelas 2 e 3 a 29",
      quote:
        "TABELA 2 - IMÓVEIS COM ÁREA ≤ 750 m² E ALTURA ≤ 12 m; TABELA 5 - GRUPO C COM ÁREA ≥ 750 m² OU ALTURA ≥ 12 m",
    },
  ),
  guard(
    "GUARD-multiple-blocks",
    "Mais de um bloco",
    fact("single_block", "eq", false),
    "Mais de um bloco ou área no imóvel: a área considerada depende do isolamento de risco entre eles. Análise específica.",
    {
      doc: "IN-1-P2",
      locator: "Art. 7º",
      quote:
        "quando o imóvel for composto por mais de um bloco/área, sendo eles isolados entre si, não são somadas suas áreas",
    },
  ),
  guard(
    "GUARD-mixed-use",
    "Mais de uma ocupação",
    fact("single_use", "eq", false),
    "Mais de uma ocupação no imóvel (mista, subsidiária ou secundária): os SMSCI seguem as regras dos arts. 10 a 12. Análise específica.",
    { doc: "IN-1-P2", locator: "Arts. 10 a 12" },
  ),
  guard(
    "GUARD-storage-over-3-5m",
    "Armazenamento acima de 3,5 m",
    { all: [DIVISION_C, fact("storage_over_3_5m", "eq", true)] },
    "Grupo C com armazenamento acima de 3,5 m é ocupação mista (C e J) e deve usar a tabela por altura de armazenagem. Análise específica.",
    {
      doc: "IN-3",
      locator: "Art. 8º",
      quote:
        "Edificações do grupo C, com altura de armazenamento de materiais superior a 3,5 m, são consideradas como ocupação mista (C e J)",
    },
  ),
];

export const GROUP_C_RULES: Rule[] = [
  ...deriveFireLoadClass,
  ...deriveRegime,
  ...deriveHeightClass,
  ...guards,
  ...GROUP_C_RISK_RULES,
  ...compileTable(table2, TABLE_2_SPEC),
  ...compileTable(table5, TABLE_5_SPEC),
];
