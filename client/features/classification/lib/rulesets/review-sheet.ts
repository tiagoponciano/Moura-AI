import type { Condition } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table5Json from "../../norms/in-1-p2/tables/table-05.json";
import { TABLE_2_SPEC, TABLE_5_SPEC } from "./group-c";
import { NORM_VALID_FROM } from "./compile-table";
import { systemIdFromLabel, systemLabel } from "./systems";
import type { ExtractedTable, NoteEffect, NoteSpec, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table5 = table5Json as unknown as ExtractedTable;

const number = (n: number) => n.toLocaleString("pt-BR");

const FACT: Record<string, { name: string; unit?: string }> = {
  division: { name: "a divisão" },
  area_m2: { name: "a área", unit: "m²" },
  height_m: { name: "a altura", unit: "m" },
  storeys: { name: "o número de pavimentos" },
  fire_load_class: { name: "a classe de carga de incêndio" },
  fire_load_mj_m2: { name: "a carga de incêndio específica", unit: "MJ/m²" },
  single_block: { name: "o imóvel tem um só bloco" },
  single_use: { name: "o imóvel tem uma só ocupação" },
  storage_over_3_5m: { name: "há armazenamento acima de 3,5 m" },
};

const CLASS_LABEL: Record<string, string> = {
  negligible: "desprezível",
  low: "baixa",
  medium: "média",
  high: "alta",
  very_high: "altíssima",
};

const OP: Record<string, string> = {
  lt: "menor que",
  lte: "menor ou igual a",
  gt: "maior que",
  gte: "maior ou igual a",
};

function value(factName: string, v: unknown): string {
  if (typeof v === "number") {
    const unit = FACT[factName]?.unit;
    return unit ? `${number(v)} ${unit}` : number(v);
  }
  if (typeof v === "boolean") return v ? "sim" : "não";
  return factName === "fire_load_class"
    ? (CLASS_LABEL[String(v)] ?? String(v))
    : String(v);
}

/** The condition in Portuguese, the same words the reviewer reads in the norm. */
export function describeCondition(condition: Condition): string {
  if ("all" in condition) {
    if (condition.all.length === 0) return "sempre";
    return condition.all.map(wrap).join(" e ");
  }
  if ("any" in condition) return condition.any.map(wrap).join(" ou ");
  if ("not" in condition) return `não (${describeCondition(condition.not)})`;
  const fact = FACT[condition.fact]?.name ?? condition.fact;
  if (
    condition.fact === "storeys" &&
    condition.op === "eq" &&
    condition.value === 1
  ) {
    return "o prédio é térreo (um pavimento, altura 0, art. 8º V)";
  }
  if (condition.op === "eq") {
    if (typeof condition.value === "boolean") {
      return condition.value ? fact : `não: ${fact}`;
    }
    return `${fact} é ${value(condition.fact, condition.value)}`;
  }
  if (condition.op === "in") {
    return `${fact} é ${(condition.value as (string | number)[])
      .map((v) => value(condition.fact, v))
      .join(" ou ")}`;
  }
  return `${fact} é ${OP[condition.op]} ${value(condition.fact, condition.value)}`;
}

function wrap(condition: Condition): string {
  const text = describeCondition(condition);
  return ("all" in condition && condition.all.length > 1) ||
    ("any" in condition && condition.any.length > 1)
    ? `(${text})`
    : text;
}

/** Every number a condition compares a fact with, as "fact op limit". */
function limits(condition: Condition): string[] {
  if ("all" in condition) return condition.all.flatMap(limits);
  if ("any" in condition) return condition.any.flatMap(limits);
  if ("not" in condition) return limits(condition.not);
  if (typeof condition.value !== "number" || condition.op === "eq") return [];
  const at = condition.value;
  const inclusive = condition.op === "lte" || condition.op === "gte";
  const atText = value(condition.fact, at);
  const subject = FACT[condition.fact]?.name ?? condition.fact;
  const above = condition.op === "gt" || condition.op === "gte";
  const holdsAt = inclusive ? "sim" : "não";
  const side = above ? "logo acima" : "logo abaixo";
  return [
    `${subject} é ${OP[condition.op]} ${atText}: em exatamente ${atText} → ${holdsAt}; ${side} → sim`,
  ];
}

function effectLines(effect: NoteEffect): string[] {
  if (effect.kind === "info")
    return [`Informação, sem efeito na exigência: ${effect.text}`];
  if (effect.kind === "require_when") {
    const scope = effect.scope ? `, limitado a: ${effect.scope}` : "";
    return [`Exigido quando ${describeCondition(effect.when)}${scope}.`];
  }
  const when = effect.when ? ` quando ${describeCondition(effect.when)}` : "";
  const by = effect.by.map(systemLabel).join(" + ");
  return [
    `Pode ser substituído por ${by}${when} (apenas informação, o sistema continua exigido).`,
  ];
}

export const GENERAL_QUESTIONS = [
  '**Exatamente 750 m² ou 12 m.** A Tabela 2 vale para área ≤ 750 m² e altura ≤ 12 m; as tabelas por altura valem para área ≥ 750 m² ou altura ≥ 12 m. Um imóvel com exatamente 750 m² (ou 12 m) cai nas duas. Qual vale? Enquanto isso, o sistema responde "análise específica" e não lista sistemas.',
  '**Térreo e H ≤ 6.** A norma diz que edificações térreas têm altura 0 (art. 8º, V). O código usa a coluna "Térreo" só para prédios de um pavimento e "H ≤ 6" para os de mais de um pavimento. Confirmar.',
  "**O que conta como pavimento.** O art. 8º tira da altura os mezaninos, casas de máquinas e alguns subsolos. O código usa o número de pavimentos informado pelo usuário e não faz essas exclusões. Como a Moura quer contar?",
  "**Gás combustível (IN 8).** Aparece como exigido em todas as colunas do Grupo C. Vale para qualquer imóvel do grupo, mesmo sem instalação de gás?",
  "**Carga de incêndio.** O código aceita a classe (desprezível a altíssima) ou o valor em MJ/m² e deriva a classe pelos limites da IN 3, art. 11. Quem informa esse valor para o cliente? A IN 3 tem uma tabela por atividade (Anexo B) que ainda não está carregada.",
  "**Divisão C-1, C-2 ou C-3.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?",
  '**Escopo desta versão.** Só entra: Grupo C, um bloco, uma ocupação e armazenamento até 3,5 m. Fora disso o resultado é "análise específica". É aceitável como primeira entrega?',
  "**Ainda não existe:** o nível de risco I a V (IN 1 parte 1) e o tratamento de edificações existentes (IN 5). O resultado mostra só os sistemas exigidos.",
];

const SPECS: { spec: TableSpec; table: ExtractedTable }[] = [
  { spec: TABLE_2_SPEC, table: table2 },
  { spec: TABLE_5_SPEC, table: table5 },
];

function noteSection(table: ExtractedTable, note: NoteSpec): string[] {
  const printed = table.notes.find((n) => n.number === note.number)?.text ?? "";
  const lines = [
    `### Tabela ${table.table}, nota ${note.number}`,
    "",
    `**Texto da norma:** ${printed}`,
    "",
    "**Leitura do código:**",
    "",
    ...note.effects.flatMap(effectLines).map((l) => `- ${l}`),
  ];
  const bounds = note.effects.flatMap((e) =>
    e.kind === "info" ? [] : limits(e.when ?? { all: [] }),
  );
  if (bounds.length) {
    lines.push(
      "",
      "**Valores-limite:**",
      "",
      ...[...new Set(bounds)].map((l) => `- ${l}`),
    );
  }
  if (note.questions.length) {
    lines.push(
      "",
      "**Perguntas:**",
      "",
      ...note.questions.map((q) => `- ${q}`),
    );
  }
  return [...lines, ""];
}

function matrix(table: ExtractedTable, spec: TableSpec): string[] {
  const head = ["Sistema", "IN", ...spec.columns.map((c) => c.label)];
  const rows = table.rows.map((row) => {
    const cells = spec.columns.map((c) => {
      const cell = row.cells[c.index];
      return cell.raw.replace(/\s+/g, " ");
    });
    const label = `${systemLabel(systemIdFromLabel(row.system))}${row.vital_on_label ? " (V)" : ""}`;
    return [label, row.norm, ...cells];
  });
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(head.map(() => "---")), ...rows.map(line)];
}

/** The Portuguese review sheet for the Grupo C rules; generated, never edited by hand. */
export function renderGroupCReviewSheet(): string {
  const out: string[] = [
    "# Regras do Grupo C: folha de revisão",
    "",
    "Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.",
    "",
    "## Estado",
    "",
    "- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.",
    `- Fonte: IN 1 parte 2, Anexo B, Tabelas 2 (coluna C) e 5, e IN 3, arts. 8º e 11. Em vigor desde ${NORM_VALID_FROM.split("-").reverse().join("/")} (IN 1 parte 2, art. 31; IN 3, art. 14).`,
    '- Cobertura: só o Grupo C (comercial: C-1, C-2 e C-3). As demais divisões respondem "análise específica".',
    "",
    "## Perguntas para a Moura",
    "",
    "### Gerais",
    "",
    ...GENERAL_QUESTIONS.map((q, i) => `${i + 1}. ${q}`),
    "",
    "### Por nota",
    "",
  ];
  for (const { spec, table } of SPECS) {
    for (const note of spec.notes) {
      for (const q of note.questions)
        out.push(`- Tabela ${table.table}, nota ${note.number}: ${q}`);
    }
  }
  out.push("", "## Como o código lê cada nota", "");
  for (const { spec, table } of SPECS) {
    for (const note of spec.notes) out.push(...noteSection(table, note));
  }
  out.push("## Tabelas como estão impressas na norma", "");
  for (const { spec, table } of SPECS) {
    out.push(
      `### Tabela ${table.table}: ${table.title}`,
      "",
      ...matrix(table, spec),
      "",
    );
  }
  return `${out.join("\n").trimEnd()}\n`;
}
