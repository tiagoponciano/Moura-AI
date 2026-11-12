import { DIVISIONS } from "./catalog/activities";

/** Name of the LLM tool that records the answers to the questions. */
export const RECORD_ANSWERS_TOOL = "record_answers";

/** Name of the LLM tool that looks an activity up in IN 3, Annex A. */
export const SEARCH_ACTIVITY_TOOL = "search_activity";

/** The division options: Grupo C with its description from IN 1 parte 2, Tabela 1, the rest by id. */
const DIVISION_LABEL: Record<string, string> = {
  "C-1": "C-1 · Comércio de baixa carga de incêndio",
  "C-2": "C-2 · Comércio de média, alta ou altíssima carga de incêndio",
  "C-3": "C-3 · Shopping center",
};

type Base = {
  /** The fact the engine reads. */
  fact: string;
  /** Row label in the panel. */
  label: string;
  /** What the assistant asks, in Brazilian Portuguese. */
  ask: string;
  /** What the model must know to fill it, in English. */
  description: string;
  /** Whether "não sei" is a valid answer; the engine then waits for a professional. */
  allowUnknown: boolean;
  /** False for a fact that is only an alternative way to answer another one. */
  askable: boolean;
  /**
   * For a confirmation that keeps the building inside what the rules cover:
   * `clause` is true of an in-scope building and `inScope` is the fact's value
   * then. Open ones are asked together.
   */
  scope?: { clause: string; inScope: boolean };
};

export type Question = Base &
  (
    | { kind: "activity" }
    | { kind: "number"; unit: string; integer?: boolean }
    | { kind: "boolean" }
    | { kind: "enum"; options: { value: string; label: string }[] }
  );

/** In the order the assistant asks them. */
export const QUESTIONS: Question[] = [
  {
    fact: "activity",
    kind: "activity",
    label: "Atividade (IN 3, Anexo A)",
    ask: "Qual é a atividade do imóvel? Por exemplo: loja de roupas, supermercado ou shopping.",
    description:
      "Id of the activity found with the search_activity tool, never one you made up. Recording it sets the division and, when the norm gives it, the fire load. Record it only after the user confirms which activity it is.",
    allowUnknown: false,
    askable: false,
  },
  {
    fact: "division",
    kind: "enum",
    label: "Divisão da ocupação",
    ask: "Qual é a atividade do imóvel? Por exemplo: loja de roupas, supermercado ou shopping.",
    description:
      "Occupancy division id such as C-2 (IN 1 parte 2, Tabela 1). Prefer recording the activity, which sets it. Only C-1 (commerce with low fire load), C-2 (medium, high or very high) and C-3 (shopping centers) have rules; other divisions are accepted and get a specific analysis. Use other for an activity the norm does not list.",
    options: [
      ...DIVISIONS.map((division) => ({
        value: division,
        label: DIVISION_LABEL[division] ?? division,
      })),
      { value: "other", label: "Outra ocupação (não listada)" },
    ],
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "area_m2",
    kind: "number",
    unit: "m²",
    label: "Área construída (m²)",
    ask: "Qual é a área total construída, em m²?",
    description: "Total built area of the property, in square meters",
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "storeys",
    kind: "number",
    unit: "",
    integer: true,
    label: "Pavimentos",
    ask: "Quantos pavimentos tem o imóvel?",
    description:
      "Number of storeys; 1 for a single-storey building. Never derive it from the height.",
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "height_m",
    kind: "number",
    unit: "m",
    label: "Altura (m)",
    ask: "Qual é a altura da edificação, em metros, do piso mais baixo ocupado ao piso do último pavimento?",
    description:
      "Height in meters from the lowest occupied floor to the floor of the last storey. Never derive it from the number of storeys.",
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "fire_load_class",
    kind: "enum",
    label: "Carga de incêndio",
    ask: "Qual é a classe de carga de incêndio (desprezível, baixa, média, alta ou altíssima)? Se souber o valor em MJ/m², pode informar.",
    description:
      "Fire load class of IN 3 art. 11: negligible (up to 100 MJ/m²), low (up to 300), medium (up to 1,200), high (up to 2,280), very_high (above). Fill it only when the user states the class; if they give a value in MJ/m², fill fire_load_mj_m2 instead.",
    options: [
      { value: "negligible", label: "Desprezível (até 100 MJ/m²)" },
      { value: "low", label: "Baixa (até 300 MJ/m²)" },
      { value: "medium", label: "Média (até 1.200 MJ/m²)" },
      { value: "high", label: "Alta (até 2.280 MJ/m²)" },
      { value: "very_high", label: "Altíssima (acima de 2.280 MJ/m²)" },
    ],
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "fire_load_mj_m2",
    kind: "number",
    unit: "MJ/m²",
    label: "Carga de incêndio específica (MJ/m²)",
    ask: "Qual é a carga de incêndio específica, em MJ/m²?",
    description:
      "Specific fire load in MJ/m², when the user gives the value instead of the class",
    allowUnknown: false,
    askable: false,
  },
  {
    fact: "single_block",
    kind: "boolean",
    label: "Bloco único",
    ask: "O imóvel é um só bloco, sem outras edificações ou áreas no mesmo terreno?",
    description:
      "True when the property is a single block or area; false when there is more than one block or area on the property.",
    allowUnknown: true,
    askable: true,
    scope: {
      clause: "é um bloco só (sem outras edificações no terreno)",
      inScope: true,
    },
  },
  {
    fact: "single_use",
    kind: "boolean",
    label: "Uma só ocupação",
    ask: "Há uma só atividade no imóvel, sem outra ocupação misturada?",
    description:
      "True when the whole property has one use; false when other uses are mixed in (mixed, subsidiary or secondary occupancy).",
    allowUnknown: true,
    askable: true,
    scope: {
      clause: "tem uma só atividade (sem outra ocupação misturada)",
      inScope: true,
    },
  },
  {
    fact: "storage_over_3_5m",
    kind: "boolean",
    label: "Armazenamento acima de 3,5 m",
    ask: "Existe armazenamento de materiais com mais de 3,5 m de altura?",
    description:
      "True when materials are stored higher than 3.5 meters; false when not.",
    allowUnknown: true,
    askable: true,
    scope: {
      clause: "não tem armazenamento acima de 3,5 m",
      inScope: false,
    },
  },
];

export const QUESTION_BY_FACT = new Map(QUESTIONS.map((q) => [q.fact, q]));

/** Questions the assistant or the panel asks directly. */
export const ASKABLE_QUESTIONS = QUESTIONS.filter((q) => q.askable);

export const questionFor = (fact: string): Question | undefined =>
  QUESTION_BY_FACT.get(fact);

/** What to ask now: one question, or one for every scope confirmation still open. */
export type NextAsk = { ask: string; facts: string[] };

export function nextAsk(questions: Question[]): NextAsk | undefined {
  const first = questions[0];
  if (!first) return undefined;
  const scoped = questions.filter((q) => q.scope);
  if (first.scope && scoped.length > 1) {
    const clauses = scoped.map((q) => q.scope!.clause);
    const list =
      clauses.length > 2
        ? `${clauses.slice(0, -1).join(", ")} e ${clauses[clauses.length - 1]}`
        : clauses.join(" e ");
    return {
      ask: `O imóvel ${list}? Se algum desses pontos não for verdade, diga qual.`,
      facts: scoped.map((q) => q.fact),
    };
  }
  return { ask: first.ask, facts: [first.fact] };
}
