import type { Condition } from "../engine/types";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table5Json from "../../norms/in-1-p2/tables/table-05.json";
import table3Json from "../../norms/in-1-p2/tables/table-03.json";
import table4Json from "../../norms/in-1-p2/tables/table-04.json";
import table6Json from "../../norms/in-1-p2/tables/table-06.json";
import table7Json from "../../norms/in-1-p2/tables/table-07.json";
import table13Json from "../../norms/in-1-p2/tables/table-13.json";
import table15Json from "../../norms/in-1-p2/tables/table-15.json";
import table16Json from "../../norms/in-1-p2/tables/table-16.json";
import table8Json from "../../norms/in-1-p2/tables/table-08.json";
import table9Json from "../../norms/in-1-p2/tables/table-09.json";
import table10Json from "../../norms/in-1-p2/tables/table-10.json";
import table22Json from "../../norms/in-1-p2/tables/table-22.json";
import table23Json from "../../norms/in-1-p2/tables/table-23.json";
import table24Json from "../../norms/in-1-p2/tables/table-24.json";
import table11Json from "../../norms/in-1-p2/tables/table-11.json";
import table12Json from "../../norms/in-1-p2/tables/table-12.json";
import table17Json from "../../norms/in-1-p2/tables/table-17.json";
import table18Json from "../../norms/in-1-p2/tables/table-18.json";
import table19Json from "../../norms/in-1-p2/tables/table-19.json";
import table20Json from "../../norms/in-1-p2/tables/table-20.json";
import table21Json from "../../norms/in-1-p2/tables/table-21.json";
import table14Json from "../../norms/in-1-p2/tables/table-14.json";
import { TABLE_2_SPEC, TABLE_5_SPEC } from "./group-c";
import { TABLE_2_D_SPEC, TABLE_6_SPEC } from "./group-d";
import { TABLE_2_A_SPEC, TABLE_3_A23_SPEC } from "./group-a";
import { TABLE_2_B_SPEC, TABLE_4_SPEC } from "./group-b";
import { TABLE_2_E_SPEC, TABLE_7_SPEC } from "./group-e";
import {
  TABLE_15_SPEC,
  TABLE_16_SPEC,
  TABLE_17_SPEC,
  TABLE_2_H146_SPEC,
  TABLE_2_H235_SPEC,
} from "./group-h";
import { TABLE_13_SPEC, TABLE_14_SPEC, TABLE_2_G_SPEC } from "./group-g";
import { TABLE_22_SPEC } from "./group-k";
import { TABLE_23_SPEC, TABLE_24_SPEC } from "./group-m";
import {
  TABLE_10_SPEC,
  TABLE_11_SPEC,
  TABLE_12_SPEC,
  TABLE_2_F11_SPEC,
  TABLE_2_F9_SPEC,
  TABLE_2_F_MAIN_SPEC,
  TABLE_8_SPEC,
  TABLE_9_SPEC,
} from "./group-f";
import {
  TABLE_18_SPEC,
  TABLE_19_SPEC,
  TABLE_20_SPEC,
  TABLE_21_SPEC,
  TABLE_2_IJ_SPEC,
} from "./group-ij";
import { NORM_VALID_FROM } from "./compile-table";
import { systemIdFromLabel, systemLabel } from "./systems";
import type { ExtractedTable, NoteEffect, NoteSpec, TableSpec } from "./types";

const table2 = table2Json as unknown as ExtractedTable;
const table5 = table5Json as unknown as ExtractedTable;
const table6 = table6Json as unknown as ExtractedTable;
const table3 = table3Json as unknown as ExtractedTable;
const table4 = table4Json as unknown as ExtractedTable;
const table15 = table15Json as unknown as ExtractedTable;
const table16 = table16Json as unknown as ExtractedTable;
const table17 = table17Json as unknown as ExtractedTable;
const table8 = table8Json as unknown as ExtractedTable;
const table9 = table9Json as unknown as ExtractedTable;
const table10 = table10Json as unknown as ExtractedTable;
const table11 = table11Json as unknown as ExtractedTable;
const table12 = table12Json as unknown as ExtractedTable;
const table22 = table22Json as unknown as ExtractedTable;
const table23 = table23Json as unknown as ExtractedTable;
const table24 = table24Json as unknown as ExtractedTable;
const table18 = table18Json as unknown as ExtractedTable;
const table19 = table19Json as unknown as ExtractedTable;
const table20 = table20Json as unknown as ExtractedTable;
const table21 = table21Json as unknown as ExtractedTable;
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
  '**Escopo desta versão.** Entra: Grupo C, um bloco, uma só ocupação (ou outras ocupações só subsidiárias, ver a pergunta sobre ocupação subsidiária) e armazenamento até 3,5 m. Fora disso o resultado é "análise específica". É aceitável como primeira entrega?',
  '**Nível de risco (IN 1 parte 1, art. 5º e Anexo A).** O código avalia na ordem V, I, II, III e IV. A carga de incêndio é necessária mesmo para um imóvel pequeno, porque o risco V é "carga acima de 2.280 MJ/m²". Confirmar essa leitura.',
  '**Risco I.** Foi reduzido a uma pergunta de sim/não ("a atividade se enquadra numa das dispensas?"). As dispensas têm detalhes (ambulante com tenda de até 50 m², residência de até 200 m² com no máximo 1 empregado…). Quem responde, e basta o sim/não?',
  "**Risco III para C-2.** O Quadro 2 só traz C-2 de carga média e de carga alta. Um C-2 com carga baixa ou desprezível não tem linha, e o código o enquadra no risco IV. Confirmar, ou indicar a linha que vale.",
  '**Líquidos inflamáveis e combustíveis.** A norma fala em inflamável classe I acima de 1.000 L para o risco V e em "líquido inflamável" (interno) e "inflamável/combustível" (externo) para o risco II. O código pergunta um volume só de "inflamáveis ou combustíveis" em área interna e outro em área externa. Basta, ou é preciso separar a classe?',
  "**Altura no risco.** O código usa a mesma altura da exigência dos sistemas (art. 8º: térreo vale 0) também para o Quadro 2. Confirmar.",
  "**Ocupação subsidiária (IN 1 parte 2, art. 10).** Quando o usuário diz que há mais de uma ocupação, o código pergunta se as outras são só subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas (art. 10, § 4º) e sem depósito acima de 1.000 m² (IN 1 parte 1, art. 4º, IV). Se sim, valem os sistemas da ocupação predominante, com a observação da compartimentação de garagens (§§ 1º a 3º). Se não, é ocupação mista ou secundária e vai para análise específica. Quem responde essa pergunta, e os limites usados estão certos?",
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
  const rows = table.rows
    .filter((row) => spec.part === undefined || row.part === spec.part)
    .map((row) => {
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
  '**Escopo do Grupo D.** Entra: Grupo D, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C (IN 3, art. 8º) e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo D, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o D.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  '**Risco III do Grupo D.** O Quadro 2 traz uma linha "D, Todas" por faixa de altura (até 6 m, 6 a 12 m, 12 a 21 m). O código aplica as três às divisões D-1 a D-4. Confirmar.',
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
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
  '**Escopo do Grupo E.** Entra: Grupo E, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo E, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o E.',
  '**Células com duas notas na Tabela 7.** O PDF traz "x⁷⁻⁸" (detecção) e "x⁹ _ ¹³" (elevador). O código leu como duas notas cada (7 e 8; 9 e 13), porque assim todas as 13 notas são citadas exatamente uma vez. Confirmar que não é um intervalo.',
  "**Pergunta nova: salas de aula.** A dispensa da nota 8 depende de a maior parte das salas de aula ter saída direta para uma área externa aberta. O código pergunta isso ao usuário, só para escolas de até 2 pavimentos e só nas colunas até 6 m (onde a célula cita a nota 8). Basta um sim ou não?",
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo E.** O Quadro 2 traz duas linhas: E-1 a E-4 (até 21 m e 5.000 m²) e E-5 e E-6 (até 12 m e 750 m²). O código as aplica como estão. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
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
  '**Escopo do Grupo G.** Entra: Grupo G, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Uma garagem que é parte de outro imóvel é ocupação subsidiária desse imóvel e segue as regras da predominante (art. 10). Fora disso o resultado é "análise específica". É aceitável?',
  '**Coluna compartilhada da Tabela 2.** A coluna "A-2, A-3, D, E e G" vale para o Grupo G, e a nota 1 (isenção de brigadistas) cita só A-1, A-2 e J-1. Confirmar que a brigada é exigida para o G.',
  '**Células com duas notas na Tabela 14.** O PDF traz "x²⁻³" (compartimentação horizontal). O código leu como as notas 2 e 3 (exigida só para G-4, e pode ser substituída por chuveiros), porque assim as seis notas são citadas. Confirmar que não é um intervalo.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo G.** O Quadro 2 traz linhas por divisão: G-1, G-2 e G-5 (até 21 m e 5.000 m²), G-3 (térreo, até 750 m²) e G-4 (até 6 m e 5.000 m², ou de 6 a 12 m e 3.000 m²). A linha de G-3 só decide quando o risco II falha, porque ele vem antes e já cobre térreo até 750 m². Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
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
  '**Escopo do Grupo B.** Entra: Grupo B, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Um hotel costuma ter restaurante, salão de festas e garagem: o código pergunta se são só subsidiárias e, se forem, aplica as regras do hotel; se não, o resultado é "análise específica". É aceitável?',
  "**Tabela 4 tem cinco colunas de altura.** Térrea, até 6 m, de 6 a 12 m, de 12 a 30 m e acima de 30 m (as outras tabelas dividem em 23 m). O código usa as colunas como estão impressas.",
  '**Instalações elétricas vitais no B.** Na coluna B da Tabela 2 a célula das instalações elétricas traz "(V)" (vital) e a nota 2 (área a partir de 200 m²); nas outras colunas ela não é vital. O código lê assim.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo B.** O Quadro 2 traz duas linhas para B-1 e B-2: até 6 m com até 5.000 m², e de 6 a 12 m com até 4.000 m². O código as aplica às duas divisões. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
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

/** The questions of the Grupo C sheet that hold for any group, plus the ones of A-2 and A-3. */
export const GENERAL_QUESTIONS_A = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão A-2 e A-3.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final?",
  '**A-1 não está coberto.** A grade do A-1 (casas e condomínios horizontais) depende do tipo de construção (geminada/conjugada, isolada, unifamiliar mista) e de fatos que o código ainda não pergunta (abrigo ou central de GLP, quantidade de lotes). O A-1 responde "análise específica". É aceitável como primeira entrega?',
  '**Escopo do Grupo A.** Entra: A-2 ou A-3, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Um edifício residencial costuma ter garagem, salão de festas e academia: o código pergunta se são só subsidiárias e, se forem, aplica as regras do prédio; se não, o resultado é "análise específica". É aceitável?',
  "**Brigada.** Nas duas tabelas, a nota 1 diz que A-2 está isento de brigadistas. O código lê que a brigada é exigida só para A-3.",
  "**Tabela 3 divide as alturas em 6, 15 e 30 m.** As outras tabelas dividem em 6, 12, 23 e 30 m. O código usa as colunas como estão impressas.",
  '**Células com duas notas na Tabela 3.** O PDF traz "x⁹⁻¹⁰" (compartimentação vertical) e "x¹⁵⁻¹⁶" (controle de materiais de acabamento). O código leu como duas notas cada, porque assim as notas são citadas uma vez. Confirmar que não é um intervalo.',
  "**Controle de materiais de acabamento (notas 15 e 16).** O código combina as duas: acima de 12 m, e só nas áreas comuns para A-2. Nas colunas que citam só a nota 16, vale sem a altura mínima. Confirmar.",
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III de A-2 e A-3.** O Quadro 2 traz A-1 e A-2 juntos (até 21 m e 5.000 m²) e A-3 (até 21 m e 2.500 m²). O código aplica a linha só ao A-2, porque o A-1 não está coberto. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the A-2 and A-3 rules; generated, never edited by hand. */
export function renderGroupAReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo A (A-2 e A-3): folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna A-2, A-3, D, E e G) e 3 (grade de A-2 e A-3); IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo A, divisões A-2 (multifamiliar vertical) e A-3 (coletiva), com as regras de nível de risco, travas e carga de incêndio que elas compartilham com os demais grupos cobertos. O A-1 e as divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_A,
    specs: [
      { spec: TABLE_2_A_SPEC, table: table2 },
      { spec: TABLE_3_A23_SPEC, table: table3 },
    ],
  });
}

/** The two columns of Tabela 2 for Grupo H, printed side by side on the sheet. */
const TABLE_2_H_SHEET_SPEC: TableSpec = {
  ...TABLE_2_H146_SPEC,
  columns: [...TABLE_2_H146_SPEC.columns, ...TABLE_2_H235_SPEC.columns],
};

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo H. */
export const GENERAL_QUESTIONS_H = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão H-1 a H-6.** A divisão vem da conversa (o assistente propõe a partir da descrição e o usuário confirma). Quem valida a divisão final? As tabelas por altura dependem dela: a Tabela 15 vale para H-1, H-2 e H-6, a Tabela 16 para H-3 e a Tabela 17 para H-4 e H-5; e a Tabela 2 tem duas colunas (H-1, H-4 e H-6; H-2, H-3 e H-5).",
  '**Escopo do Grupo H.** Entra: Grupo H, um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  "**Vital nas duas colunas da Tabela 2.** Na coluna de H-1, H-4 e H-6 as instalações elétricas são vitais e a iluminação de emergência não; na de H-2, H-3 e H-5 é o contrário. O código lê como está impresso.",
  '**Células com duas notas na Tabela 15.** O PDF traz "x⁴⁻⁵" (compartimentação vertical). O código leu como as notas 4 e 5, porque assim as onze notas são citadas. Confirmar que não é um intervalo.',
  "**Hospitais psiquiátricos.** A nota 5 da Tabela 17 amplia os locais da detecção para hospitais psiquiátricos e assemelhados. O código não pergunta isso: o texto fica no escopo e vale como observação. É preciso perguntar?",
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo H.** O Quadro 2 traz cinco linhas: H-1 e H-4 (até 21 m e 5.000 m²), H-2 (até 12 m e 5.000 m²), H-3 e H-5 (até 6 m e 750 m²) e H-6 (até 6 m e 5.000 m², ou de 6 a 12 m e 2.500 m²). O código as aplica como estão. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo H rules; generated, never edited by hand. */
export function renderGroupHReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo H: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (colunas H-1, H-4 e H-6, e H-2, H-3 e H-5), 15, 16 e 17; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo H (serviços de saúde e institucional: H-1 a H-6), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_H,
    specs: [
      { spec: TABLE_2_H_SHEET_SPEC, table: table2 },
      { spec: TABLE_15_SPEC, table: table15 },
      { spec: TABLE_16_SPEC, table: table16 },
      { spec: TABLE_17_SPEC, table: table17 },
    ],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of groups I and J. */
export const GENERAL_QUESTIONS_IJ = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  '**Divisão I-1 a I-3 e J-1 a J-4.** A divisão vem da conversa e o usuário confirma. Quem valida a divisão final? A Tabela 18 vale para I-1 e I-2, a 19 para I-3, a 20 para J-1 e J-2 e a 21 para J-3 e J-4; a Tabela 2 tem uma coluna única "I, J e M3", que o código usa só para I e J (M-3 está fora).',
  '**Escopo dos grupos I e J.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Área de depósito (J).** As notas 2 da Tabela 20 e 6 da Tabela 21 usam a área de depósito, não a área total. O código acrescenta uma pergunta própria ("Área de depósito, em m²") e aceita "não sei". É assim que a norma quer? E a nota 5 da Tabela 20 ("área maior que 500 m²") foi lida como a área total.',
  '**Brigada de J-1.** A nota 1 da Tabela 2 isenta A-1, A-2 e J-1 de brigadistas, e a Tabela 20 isenta J-1. Na coluna única "I, J e M3" o código isenta só J-1 e exige a brigada das demais divisões de I e J. Confirmar.',
  '**Células com duas notas.** A Tabela 20 traz "x⁴⁻⁵" (compartimentação vertical). O código leu como as notas 4 e 5, porque assim as nove notas são citadas. Confirmar que não é um intervalo.',
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III dos grupos I e J.** O Quadro 2 traz: I-1 e J-1 (até 21 m e 5.000 m²), I-2 (até 12 m e 5.000 m²), I-3 e J-2 (até 6 m e 4.000 m², ou de 6 a 12 m e 3.000 m²), J-3 (até 6 m e 3.000 m²) e J-4 (até 6 m e 2.500 m²). O código as aplica como estão. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupos I and J rules; generated, never edited by hand. */
export function renderGroupIJReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras dos Grupos I e J: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (coluna I, J e M3), 18, 19, 20 e 21; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'os Grupos I (indústria: I-1 a I-3) e J (depósito: J-1 a J-4), com as regras de nível de risco, travas e carga de incêndio que eles compartilham com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_IJ,
    specs: [
      { spec: TABLE_2_IJ_SPEC, table: table2 },
      { spec: TABLE_18_SPEC, table: table18 },
      { spec: TABLE_19_SPEC, table: table19 },
      { spec: TABLE_20_SPEC, table: table20 },
      { spec: TABLE_21_SPEC, table: table21 },
    ],
  });
}

/** The three columns of Tabela 2 for Grupo F, printed side by side on the sheet. */
const TABLE_2_F_SHEET_SPEC: TableSpec = {
  ...TABLE_2_F_MAIN_SPEC,
  columns: [
    ...TABLE_2_F_MAIN_SPEC.columns,
    ...TABLE_2_F9_SPEC.columns,
    ...TABLE_2_F11_SPEC.columns,
  ],
};

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo F. */
export const GENERAL_QUESTIONS_F = [
  ...GENERAL_QUESTIONS.slice(0, 5),
  "**Divisão F-1 a F-11.** A divisão vem da conversa e o usuário confirma. Quem valida a divisão final? A Tabela 8 vale para F-1 e F-2, a 9 para F-3 e F-9, a 10 para F-5, F-6, F-8 e F-10, a 11 para F-4 e a 12 para F-11; a Tabela 2 tem três colunas (F-1 a F-6, F-8 e F-10; F-9; F-11).",
  '**Escopo do Grupo F.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). O armazenamento acima de 3,5 m é regra do Grupo C e não é perguntado. Fora disso o resultado é "análise específica". É aceitável?',
  '**Lotação.** Muitas notas dependem da lotação (50, 100, 200, 250, 500, 1.000, 2.000 e 3.000 pessoas). O código pergunta uma lotação só, a do imóvel. As notas falam às vezes em "locais com público", ou seja, em cada local de reunião. Qual vale?',
  '**Funcionamento até as 18h e imóvel sem janelas.** Duas perguntas novas, para a nota 12 da Tabela 8 e a nota 8 da Tabela 10, e para a nota 4 da Tabela 2. Quem responde e o que é "sem janelas"?',
  '**Células com várias notas.** A Tabela 8 traz "x⁴⁻⁵", a Tabela 10 "x⁷⁻¹²" e a Tabela 12 "x⁵⁻⁶". O código leu como duas notas cada, não como intervalo. Confirmar.',
  "**Salão de festas subsidiário.** As notas 11 e 12 da Tabela 10 dispensam o salão de festas subsidiário de A-2 ou de qualquer ocupação com até 100 pessoas. O código não avalia isso: fica como observação.",
  ...GENERAL_QUESTIONS.slice(7, 9),
  ...GENERAL_QUESTIONS.slice(10, 12),
  "**Risco III do Grupo F.** O Quadro 3 diz: F, todas as divisões, não enquadradas no risco II, com população até 200 pessoas em cada área de reunião de público. O código usa a lotação do imóvel (até 200 pessoas) e deixa o resto para o risco IV. Confirmar.",
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo F rules; generated, never edited by hand. */
export function renderGroupFReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo F: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 2 (colunas F), 8, 9, 10, 11 e 12; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º e Anexo A (risco)",
    coverage:
      'o Grupo F (reunião de público: F-1 a F-6 e F-8 a F-11), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_F,
    specs: [
      { spec: TABLE_2_F_SHEET_SPEC, table: table2 },
      { spec: TABLE_8_SPEC, table: table8 },
      { spec: TABLE_9_SPEC, table: table9 },
      { spec: TABLE_10_SPEC, table: table10 },
      { spec: TABLE_11_SPEC, table: table11 },
      { spec: TABLE_12_SPEC, table: table12 },
    ],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of Grupo K. */
export const GENERAL_QUESTIONS_K = [
  ...GENERAL_QUESTIONS.slice(2, 5),
  "**Divisão K-1 e K-2.** A divisão vem da conversa e o usuário confirma. A Tabela 22 não depende de área nem de altura: o código não aplica a trava de exatamente 750 m² ou 12 m ao Grupo K.",
  "**Colunas.** K-1 divide por volume de líquido combustível (até 20 m³ ou acima) e K-2 por tipo de usina (hidroelétrica ou termoelétrica). O código pergunta os dois dados novos. Quem responde, e o volume vale por imóvel ou por equipamento?",
  '**Escopo do Grupo K.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). Fora disso o resultado é "análise específica". É aceitável?',
  "**Risco do Grupo K.** O Quadro 2 do Anexo A da IN 1 parte 1 não traz linha para K. O código usa as regras gerais de risco I, II e V e deixa o resto no risco IV. Confirmar.",
  ...GENERAL_QUESTIONS.slice(10, 12),
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo K rules; generated, never edited by hand. */
export function renderGroupKReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo K: folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabela 22; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º (risco)",
    coverage:
      'o Grupo K (energia: K-1 e K-2), com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_K,
    specs: [{ spec: TABLE_22_SPEC, table: table22 }],
  });
}

/** The questions of the Grupo C sheet that hold for any group, plus the ones of M-1 and M-2. */
export const GENERAL_QUESTIONS_M = [
  ...GENERAL_QUESTIONS.slice(2, 5),
  "**Divisão M-1 e M-2.** A divisão vem da conversa e o usuário confirma. As Tabelas 23 e 24 não dependem de área nem de altura: o código não aplica a trava de exatamente 750 m² ou 12 m ao Grupo M.",
  '**Faixas do túnel (M-1).** A Tabela 23 imprime "≤ 200 m", "200 ≤ 500 m", "500 ≤ 1.000 m" e "> 1.000 m". O código leu as faixas do meio como acima do limite inferior e até o superior (por exemplo, 200 m fica na primeira). Confirmar.',
  "**Tipo de instalação e quantidades (M-2).** A Tabela 24 tem cinco colunas: tanques/cilindros/processos (até ou acima de 20 m³ de líquido ou 10 m³ de gás), plataforma de carregamento e produtos acondicionados (até ou acima de 20 m³ de líquido ou 12.480 kg de gás). O código pergunta um tipo de instalação e as quantidades de líquido e de gás. Se o imóvel tem mais de uma instalação, quem decide qual vale, ou valem todas?",
  '**Escopo do Grupo M.** Entra: um bloco e uma só ocupação (ou outras só subsidiárias). Fora disso o resultado é "análise específica". É aceitável?',
  "**Risco do Grupo M.** O Quadro 2 do Anexo A da IN 1 parte 1 não traz linha para M-1 e M-2. O código usa as regras gerais de risco I, II e V e deixa o resto no risco IV. Confirmar.",
  '**Divisões M-3 a M-11.** Ainda não têm regras: respondem "análise específica".',
  ...GENERAL_QUESTIONS.slice(10, 12),
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 2],
  GENERAL_QUESTIONS[GENERAL_QUESTIONS.length - 1],
];

/** The Portuguese review sheet for the Grupo M (M-1 and M-2) rules; generated, never edited by hand. */
export function renderGroupMReviewSheet(): string {
  return renderReviewSheet({
    title: "Regras do Grupo M (M-1 e M-2): folha de revisão",
    source:
      "IN 1 parte 2, Anexo B, Tabelas 23 e 24; IN 3, art. 11 e Anexo A; IN 1 parte 1, art. 5º (risco)",
    coverage:
      'o Grupo M nas divisões M-1 (túnel) e M-2, com as regras de nível de risco, travas e carga de incêndio que ele compartilha com os demais grupos cobertos. As divisões sem regras carregadas respondem "análise específica".',
    general: GENERAL_QUESTIONS_M,
    specs: [
      { spec: TABLE_23_SPEC, table: table23 },
      { spec: TABLE_24_SPEC, table: table24 },
    ],
  });
}
