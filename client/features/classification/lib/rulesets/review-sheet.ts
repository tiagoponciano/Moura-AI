import type { Condition } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table5Json from "../../norms/in-1-p2/tables/table-05.json";
import table4Json from "../../norms/in-1-p2/tables/table-04.json";
import table6Json from "../../norms/in-1-p2/tables/table-06.json";
import table7Json from "../../norms/in-1-p2/tables/table-07.json";
import table13Json from "../../norms/in-1-p2/tables/table-13.json";
import table14Json from "../../norms/in-1-p2/tables/table-14.json";
import { TABLE_2_SPEC, TABLE_5_SPEC } from "./group-c";
import { TABLE_2_D_SPEC, TABLE_6_SPEC } from "./group-d";
import { TABLE_2_B_SPEC, TABLE_4_SPEC } from "./group-b";
import { TABLE_2_E_SPEC, TABLE_7_SPEC } from "./group-e";
import { TABLE_13_SPEC, TABLE_14_SPEC, TABLE_2_G_SPEC } from "./group-g";
import { NORM_VALID_FROM } from "./compile-table";
import { systemIdFromLabel, systemLabel } from "./systems";
import type { ExtractedTable, NoteEffect, NoteSpec, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table5 = table5Json as unknown as ExtractedTable;
const table6 = table6Json as unknown as ExtractedTable;
const table4 = table4Json as unknown as ExtractedTable;
const table7 = table7Json as unknown as ExtractedTable;
const table13 = table13Json as unknown as ExtractedTable;
const table14 = table14Json as unknown as ExtractedTable;

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
  classrooms_exit_outside: {
    name: "a maior parte das salas de aula tem saída direta para área externa aberta",
  },
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
  if (effect.kind === "exempt_when") {
    return [`Dispensado quando ${describeCondition(effect.when)}.`];
  }
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
  '**Nível de risco (IN 1 parte 1, art. 5º e Anexo A).** O código avalia na ordem V, I, II, III e IV. A carga de incêndio é necessária mesmo para um imóvel pequeno, porque o risco V é "carga acima de 2.280 MJ/m²". Confirmar essa leitura.',
  '**Risco I.** Foi reduzido a uma pergunta de sim/não ("a atividade se enquadra numa das dispensas?"). As dispensas têm detalhes (ambulante com tenda de até 50 m², residência de até 200 m² com no máximo 1 empregado…). Quem responde, e basta o sim/não?',
  "**Risco III para C-2.** O Quadro 2 só traz C-2 de carga média e de carga alta. Um C-2 com carga baixa ou desprezível não tem linha, e o código o enquadra no risco IV. Confirmar, ou indicar a linha que vale.",
  '**Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?',
  "**Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.",
  "**Ainda não existe:** a camada de edificações existentes e recentes (IN 5), que rotula cada sistema como vital, indispensável ou adequável. O resultado mostra o enquadramento de risco e os sistemas exigidos.",
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
type SheetConfig = {
  title: string;
  source: string;
  coverage: string;
  general: string[];
  specs: { spec: TableSpec; table: ExtractedTable }[];
};

function renderReviewSheet(config: SheetConfig): string {
  const out: string[] = [
    `# ${config.title}`,
    "",
    "Gerada a partir do código (`lib/rulesets/review-sheet.ts`); não edite à mão. Serve para conferir se cada nota da norma foi lida corretamente e para levar as perguntas em aberto à Moura.",
    "",
    "## Estado",
    "",
    "- **Todas as regras são provisórias.** Nenhuma foi aprovada por uma pessoa.",
    `- Fonte: ${config.source}. Em vigor desde ${NORM_VALID_FROM.split("-").reverse().join("/")} (IN 1 parte 2, art. 31; IN 3, art. 14; IN 1 parte 1, art. 165).`,
    `- Cobertura: ${config.coverage}`,
    "",
    "## Perguntas para a Moura",
    "",
    "### Gerais",
    "",
    ...config.general.map((q, i) => `${i + 1}. ${q}`),
    "",
    "### Por nota",
    "",
  ];
  for (const { spec, table } of config.specs) {
    for (const note of spec.notes) {
      for (const q of note.questions)
        out.push(`- Tabela ${table.table}, nota ${note.number}: ${q}`);
    }
  }
  out.push("", "## Como o código lê cada nota", "");
  for (const { spec, table } of config.specs) {
    for (const note of spec.notes) out.push(...noteSection(table, note));
  }
  out.push("## Tabelas como estão impressas na norma", "");
  for (const { spec, table } of config.specs) {
    out.push(
      `### Tabela ${table.table}: ${table.title}`,
      "",
      ...matrix(table, spec),
      "",
    );
  }
  return `${out.join("\n").trimEnd()}\n`;
}

const SPECS_C = [
  { spec: TABLE_2_SPEC, table: table2 },
  { spec: TABLE_5_SPEC, table: table5 },
];

/** The Portuguese review sheet for the Grupo C rules; generated, never edited by hand. */
export function renderGroupCReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo C: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna C) e 5; IN 3, arts. 8º e 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo C (comercial: C-1, C-2 e C-3); o Grupo D tem a sua própria folha. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS,
    specs: SPECS_C,
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo D. */
export const GENERAL_QUESTIONS_D = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão D-1 a D-4.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?",
  '**Escopo do Grupo D.** Só entra: Grupo D, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C (IN 3, art. 8º) e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo D, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o D.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  '**Risco III do Grupo D.** O Quadro 2 traz uma linha "D, Todas" por faixa de altura (até 6 m, 6 a 12 m, 12 a 21 m). O código aplica as três às divisões D-1 a D-4. Confirmar.',
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo D rules; generated, never edited by hand. */
export function renderGroupDReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo D: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna A-2, A-3, D, E e G) e 6; IN 3, arts. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo D (serviços profissionais: D-1 a D-4), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com o Grupo C. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_D,
    specs: [
      { spec: TABLE_2_D_SPEC, table: table2 },
      { spec: TABLE_6_SPEC, table: table6 },
    ],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo E. */
export const GENERAL_QUESTIONS_E = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão E-1 a E-6.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?",
  '**Escopo do Grupo E.** Só entra: Grupo E, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo E, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o E.',
  '**Células com duas notas na Tabela 7.** O PDF traz "x⁷⁻⁸" (detecção) e "x⁹ _ ¹³" (elevador). O código leu como duas notas cada (7 e 8; 9 e 13), porque assim todas as 13 notas são citadas exatamente uma vez. Confirmar que não é um intervalo.',
  "**Pergunta nova: salas de aula.** A dispensa da nota 8 depende de a maior parte das salas de aula ter saída direta para uma área externa aberta. O código pergunta isso ao usuário, só para escolas de até 2 pavimentos e só nas colunas até 6 m (onde a célula cita a nota 8). Basta um sim ou não?",
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo E.** O Quadro 2 traz duas linhas: E-1 a E-4 (até 21 m e 5.000 m²) e E-5 e E-6 (até 12 m e 750 m²). O código as aplica como estão. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo E rules; generated, never edited by hand. */
export function renderGroupEReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo E: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna A-2, A-3, D, E e G) e 7; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo E (educacional: E-1 a E-6), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os Grupos C e D. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_E,
    specs: [
      { spec: TABLE_2_E_SPEC, table: table2 },
      { spec: TABLE_7_SPEC, table: table7 },
    ],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo G. */
export const GENERAL_QUESTIONS_G = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão G-1 a G-5.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final? As duas tabelas por altura dependem dela: a Tabela 13 vale para G-1, G-2 e G-5, e a Tabela 14 para G-3 e G-4.",
  '**Escopo do Grupo G.** Só entra: Grupo G, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". Uma garagem é muitas vezes ocupação subsidiária de outro imóvel, o que hoje também vai para análise específica. É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo G, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o G.',
  '**Células com duas notas na Tabela 14.** O PDF traz "x²⁻³" (compartimentação horizontal). O código leu como as notas 2 e 3 (exigida só para G-4, e pode ser substituída por chuveiros), porque assim as seis notas são citadas. Confirmar que não é um intervalo.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo G.** O Quadro 2 traz linhas por divisão: G-1, G-2 e G-5 (até 21 m e 5.000 m²), G-3 (térreo, até 750 m²) e G-4 (até 6 m e 5.000 m², ou de 6 a 12 m e 3.000 m²). A linha de G-3 só decide quando o risco II falha, porque ele vem antes e já cobre térreo até 750 m². Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo G rules; generated, never edited by hand. */
export function renderGroupGReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo G: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna A-2, A-3, D, E e G), 13 e 14; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo G (serviços automotivos e assemelhados: G-1 a G-5), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_G,
    specs: [
      { spec: TABLE_2_G_SPEC, table: table2 },
      { spec: TABLE_13_SPEC, table: table13 },
      { spec: TABLE_14_SPEC, table: table14 },
    ],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo B. */
export const GENERAL_QUESTIONS_B = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão B-1 e B-2.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?",
  '**Escopo do Grupo B.** Só entra: Grupo B, um bloco e uma ocupação. O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". Um hotel costuma ter restaurante, salão de festas e garagem; o código manda isso para análise específica por ser ocupação mista. É aceitável?',
  "**Tabela 4 tem cinco colunas de altura.** Térrea, até 6 m, de 6 a 12 m, de 12 a 30 m e acima de 30 m (as outras tabelas dividem em 23 m). O código usa as colunas como estão impressas.",
  '**Instalações elétricas vitais no B.** Na coluna B da Tabela 2 a célula das instalações elétricas traz "(V)" (vital) e a nota 2 (área a partir de 200 m²); nas outras colunas ela não é vital. O código lê assim.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo B.** O Quadro 2 traz duas linhas para B-1 e B-2: até 6 m com até 5.000 m², e de 6 a 12 m com até 4.000 m². O código as aplica às duas divisões. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo B rules; generated, never edited by hand. */
export function renderGroupBReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo B: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna B) e 4; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo B (serviço de hospedagem: B-1 e B-2), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_B,
    specs: [
      { spec: TABLE_2_B_SPEC, table: table2 },
      { spec: TABLE_4_SPEC, table: table4 },
    ],
  });
}
