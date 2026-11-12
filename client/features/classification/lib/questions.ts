/** Name of the LLM tool that records the answers to the questions. */
export const RECORD_ANSWERS_TOOL = "record_answers";

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
};

export type Question = Base &
  (
    | { kind: "number"; unit: string; integer?: boolean }
    | { kind: "boolean" }
    | { kind: "enum"; options: { value: string; label: string }[] }
  );

/** In the order the assistant asks them. */
export const QUESTIONS: Question[] = [
  {
    fact: "division",
    kind: "enum",
    label: "Divisão da ocupação",
    ask: "Qual é a atividade do imóvel? Por exemplo: loja, supermercado ou shopping.",
    description:
      "Occupancy division from IN 1 parte 2, Tabela 1. C-1: commerce with low fire load (butcher, metal or glass goods, appliances, florist, cars, fermented drinks). C-2: commerce with medium, high or very high fire load (department stores, supermarkets, galleries, shoes, drugstores, bookstores, textiles, furniture). C-3: shopping centers. other: any use outside commerce.",
    options: [
      { value: "C-1", label: "C-1 · Comércio de baixa carga de incêndio" },
      {
        value: "C-2",
        label: "C-2 · Comércio de média, alta ou altíssima carga de incêndio",
      },
      { value: "C-3", label: "C-3 · Shopping center" },
      { value: "other", label: "Outra ocupação (fora do comércio)" },
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
  },
];

export const QUESTION_BY_FACT = new Map(QUESTIONS.map((q) => [q.fact, q]));

/** Questions the assistant or the panel asks directly. */
export const ASKABLE_QUESTIONS = QUESTIONS.filter((q) => q.askable);

export const questionFor = (fact: string): Question | undefined =>
  QUESTION_BY_FACT.get(fact);
