import { OCCUPATIONS, divisionLabel } from "./catalog/occupations";

/** Name of the LLM tool that records the answers to the questions. */
export const RECORD_ANSWERS_TOOL = "record_answers";

/** Name of the LLM tool that looks an activity up in IN 3, Annex A. */
export const SEARCH_ACTIVITY_TOOL = "search_activity";

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
  /** Asked only once `fact` has this value, because the rules read it only then. */
  askAfter?: { fact: string; value: boolean };
};

export type Question = Base &
  (
    | { kind: "activity" }
    | { kind: "number"; unit: string; integer?: boolean; allowZero?: boolean }
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
      ...OCCUPATIONS.map((o) => ({
        value: o.division,
        label: divisionLabel(o.division),
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
    fact: "only_subsidiary",
    kind: "boolean",
    label: "Outras ocupações só subsidiárias",
    ask: "As outras atividades são todas subsidiárias (vinculadas e fundamentais à principal, como garagem, salão de festas ou depósito de apoio), sem reunião de público para mais de 100 pessoas e sem depósito acima de 1.000 m²?",
    description:
      "True when every other use on the property is subsidiary to the main one (IN 1 parte 1, art. 4: linked to it and fundamental to it, such as a garage, a party room or a supporting store), with no assembly use for more than 100 people and no store above 1,000 square meters; false when any is mixed or secondary. Asked only when the property does not have a single use.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "single_use", value: false },
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
  {
    fact: "special_risks",
    kind: "boolean",
    label: "Riscos especiais",
    ask: "Há GLP, líquidos inflamáveis ou combustíveis, ou substâncias radioativas, tóxicas, explosivas, fogos de artifício ou munições no imóvel?",
    description:
      "True when the property has any LPG, flammable or combustible liquids, or radioactive, toxic, explosive, pyrotechnic or ammunition substances; false when it has none of them.",
    allowUnknown: true,
    askable: true,
    scope: {
      clause:
        "não tem GLP, líquidos inflamáveis ou combustíveis, nem substâncias radioativas, tóxicas ou explosivas",
      inScope: false,
    },
  },
  {
    fact: "hazardous_substances",
    kind: "boolean",
    label: "Substâncias perigosas",
    ask: "Há substâncias radioativas, tóxicas, explosivas, artefatos pirotécnicos ou munições no imóvel?",
    description:
      "True when radioactive, toxic or explosive substances, pyrotechnic articles or ammunition are made, handled, stored or sold on the property.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "special_risks", value: true },
  },
  {
    fact: "glp_kg",
    kind: "number",
    unit: "kg",
    allowZero: true,
    label: "GLP (kg)",
    ask: "Qual é a quantidade total de GLP usada ou armazenada, em kg?",
    description:
      "Total LPG used or stored on the property, in kilograms; 0 when none.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "special_risks", value: true },
  },
  {
    fact: "flammable_internal_l",
    kind: "number",
    unit: "L",
    allowZero: true,
    label: "Líquidos inflamáveis/combustíveis em área interna (L)",
    ask: "Qual é o volume de líquidos inflamáveis ou combustíveis em área interna, em litros?",
    description:
      "Flammable or combustible liquids kept inside the building, in liters; 0 when none.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "special_risks", value: true },
  },
  {
    fact: "flammable_external_m3",
    kind: "number",
    unit: "m³",
    allowZero: true,
    label: "Líquidos inflamáveis/combustíveis em área externa (m³)",
    ask: "Qual é o volume de líquidos inflamáveis ou combustíveis em área externa, em m³?",
    description:
      "Flammable or combustible liquids kept outside the building, in cubic meters; 0 when none.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "special_risks", value: true },
  },
  {
    fact: "combustible_liquid_m3",
    kind: "number",
    unit: "m³",
    allowZero: true,
    label: "Líquido combustível (m³)",
    ask: "Qual é o volume de líquido combustível do imóvel (óleo de transformadores e reatores, por exemplo), em m³?",
    description:
      "Volume of combustible liquid held on a K-1 property, in cubic meters; 0 when none. Asked only for K-1.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "power_plant_type",
    kind: "enum",
    label: "Tipo de usina",
    ask: "A usina é hidroelétrica ou termoelétrica?",
    description:
      "Type of the K-2 power plant: hydro or thermal. Asked only for K-2.",
    options: [
      { value: "hydro", label: "Hidroelétrica" },
      { value: "thermal", label: "Termoelétrica" },
    ],
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "combustible_liquid_storage",
    kind: "boolean",
    label: "Armazenamento de líquidos combustíveis",
    ask: "Há local de armazenamento de líquidos combustíveis?",
    description:
      "True when the property has a place where combustible liquids are stored; false when it has none.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "solid_fuel_storage_m2",
    kind: "number",
    unit: "m²",
    allowZero: true,
    label: "Área de combustíveis sólidos (m²)",
    ask: "Qual é a área usada para armazenar combustíveis sólidos, em m²?",
    description:
      "Floor area used to store solid fuels, in square meters; 0 when there is none.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "public_road_within_50m",
    kind: "boolean",
    label: "Acesso a até 50 m do passeio público",
    ask: "Há acesso a partir do passeio público com caminhamento máximo de 50 m?",
    description:
      "True when the building can be reached from the public sidewalk on a path of at most 50 meters; false when the path is longer.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "tunnel_length_m",
    kind: "number",
    unit: "m",
    label: "Extensão do túnel (m)",
    ask: "Qual é a extensão do túnel, em metros?",
    description: "Length of the M-1 tunnel in meters. Asked only for M-1.",
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "m2_installation",
    kind: "enum",
    label: "Tipo de instalação (M-2)",
    ask: "A instalação é de tanques, cilindros ou processos, uma plataforma de carregamento e descarregamento, ou produtos acondicionados?",
    description:
      "M-2 installation being classified: tanks_processes (tanks, cylinders and processes), loading_platform (loading and unloading platform) or packaged_products. Asked only for M-2.",
    options: [
      { value: "tanks_processes", label: "Tanques, cilindros e processos" },
      {
        value: "loading_platform",
        label: "Plataforma de carregamento/descarregamento",
      },
      { value: "packaged_products", label: "Produtos acondicionados" },
    ],
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "m2_liquid_m3",
    kind: "number",
    unit: "m³",
    allowZero: true,
    label: "Líquidos inflamáveis ou combustíveis (m³)",
    ask: "Qual é o volume de líquidos inflamáveis ou combustíveis da instalação, em m³?",
    description:
      "Volume of flammable or combustible liquids of the M-2 installation, in cubic meters; 0 when none.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "m2_gas_quantity",
    kind: "number",
    unit: "m³ ou kg",
    allowZero: true,
    label: "Gases (m³ ou kg)",
    ask: "Qual é a quantidade de gases da instalação: em m³ para tanques, cilindros e processos, ou em kg para produtos acondicionados?",
    description:
      "Quantity of gases of the M-2 installation: cubic meters for tanks_processes, kilograms for packaged_products; 0 when none.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "hose_reach_60m",
    kind: "boolean",
    label: "Mangueiras de até 60 m a partir do passeio",
    ask: "A partir do passeio público, o caminhão consegue acessar o local mais distante com mangueiras de no máximo 60 m?",
    description:
      "True when, from the public sidewalk, the fire truck reaches the farthest point with hoses of at most 60 meters; false otherwise.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "silo_support_area_m2",
    kind: "number",
    unit: "m²",
    allowZero: true,
    label: "Área das construções de apoio do silo (m²)",
    ask: "Qual é a área somada das construções de apoio do silo, em m²?",
    description:
      "Sum of the floor areas of the buildings that support the silo (M-5), in square meters; 0 when there are none. Asked only for M-5.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "planting_area_ha",
    kind: "number",
    unit: "ha",
    label: "Área de plantio (ha)",
    ask: "Qual é a área de plantio, em hectares?",
    description:
      "Planted area of the M-6 property in hectares. Asked only for M-6.",
    allowUnknown: false,
    askable: true,
  },
  {
    fact: "greenhouse_uses_gas",
    kind: "boolean",
    label: "Estufa com gás combustível",
    ask: "A estufa utiliza gás combustível?",
    description:
      "True when the M-11 greenhouse uses fuel gas; false when it does not. Asked only for M-11.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "gas_suppression_system",
    kind: "boolean",
    label: "Sistema fixo de gases para supressão de incêndio",
    ask: "O imóvel tem sistema fixo de gases para supressão de incêndio?",
    description:
      "True when the property has a fixed gas fire suppression system; false when it has none. Asked only for M-3.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "isotank_total_m3",
    kind: "number",
    unit: "m³",
    allowZero: true,
    label: "Tanques portáteis (isotanques) com líquidos (m³)",
    ask: "Qual é a capacidade total dos tanques portáteis (isotanques) com líquidos inflamáveis ou combustíveis, em m³?",
    description:
      "Total capacity of portable tanks (isotanks) holding flammable or combustible liquids, in cubic meters; 0 when there are none. Asked only for M-7.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "a1_construction",
    kind: "enum",
    label: "Construção (A-1)",
    ask: "A habitação é geminada ou conjugada, isolada, ou unifamiliar em edificação mista?",
    description:
      "How the A-1 dwelling is built: attached (semi-detached or conjoined houses), detached, or mixed_single_family (a single-family unit inside a mixed building). Asked only for A-1.",
    options: [
      { value: "attached", label: "Geminada ou conjugada" },
      { value: "detached", label: "Isolada" },
      {
        value: "mixed_single_family",
        label: "Unifamiliar em edificação mista",
      },
    ],
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "shared_gas_shelter",
    kind: "boolean",
    label: "Abrigo compartilhado ou central de GLP",
    ask: "Há abrigo compartilhado ou central de GLP?",
    description:
      "True when the A-1 property has a shared gas shelter or a central LPG installation; false when it has none. Asked only for A-1.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "lot_count",
    kind: "number",
    unit: "lotes",
    integer: true,
    allowZero: true,
    label: "Lotes do condomínio",
    ask: "Quantos lotes o condomínio residencial horizontal prevê?",
    description:
      "Number of lots planned for the A-1 horizontal residential condominium; 0 when it is not a condominium. Asked only for A-1.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "storage_area_m2",
    kind: "number",
    unit: "m²",
    allowZero: true,
    label: "Área de depósito (m²)",
    ask: "Qual é a área destinada a depósito, em m²?",
    description:
      "Floor area used as storage, in square meters, which is not the total area; 0 when there is none. Asked only for the storage divisions whose rules depend on it.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "capacity_people",
    kind: "number",
    unit: "pessoas",
    integer: true,
    label: "Lotação (pessoas)",
    ask: "Qual é a lotação do imóvel, em número de pessoas (o público que o espaço comporta)?",
    description:
      "Maximum number of people the property holds (its capacity). Asked only for the divisions whose rules depend on it.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "ends_by_18h",
    kind: "boolean",
    label: "Funcionamento até as 18h",
    ask: "O imóvel funciona só até as 18h?",
    description:
      "True when the property operates only until 18:00; false when it operates later.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "windowless",
    kind: "boolean",
    label: "Sem janelas",
    ask: "A edificação é considerada sem janelas (sem aberturas para ventilação natural)?",
    description:
      "True when the building has no windows for natural ventilation; false when it has.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "classrooms_exit_outside",
    kind: "boolean",
    label: "Salas de aula com saída para o exterior",
    ask: "A maior parte das salas de aula tem saída direta para uma área externa aberta?",
    description:
      "True when most of the classrooms open directly onto an open outdoor area; false when not. Only asked for a school of up to two storeys.",
    allowUnknown: true,
    askable: true,
  },
  {
    fact: "risk_exempt",
    kind: "boolean",
    label: "Dispensada do risco I",
    ask: "A atividade se enquadra numa das dispensas do risco I: sem estabelecimento, ambulante, em residência unifamiliar de até 200 m² com no máximo 1 empregado, agropastoril familiar, condomínio horizontal de até 6 unidades ou coworking?",
    description:
      "True when the activity is one of the risk I exemptions of IN 1 parte 1, art. 5: no establishment, street vendor, in a single-family home up to 200 m² with at most one employee, family farming, horizontal condominium of up to 6 units, or coworking; false otherwise.",
    allowUnknown: true,
    askable: true,
    scope: {
      clause:
        "não é uma atividade dispensada do risco I (como ambulante, em residência de até 200 m² ou coworking)",
      inScope: false,
    },
  },
  {
    fact: "has_basement",
    kind: "boolean",
    label: "Subsolo",
    ask: "O imóvel tem subsolo ocupado?",
    description:
      "True when the property has an occupied basement (a floor below ground level used by people or for storage); false when it has none.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "risk_exempt", value: false },
  },
  {
    fact: "basement_level",
    kind: "enum",
    label: "Nível do subsolo",
    ask: "O subsolo é o primeiro ou o segundo, ou é um subsolo mais profundo?",
    description:
      "first_second when the basement is the first or second below ground; other for the deeper ones. Asked only when the property has a basement.",
    options: [
      { value: "first_second", label: "Primeiro ou segundo subsolo" },
      { value: "other", label: "Demais subsolos" },
    ],
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "has_basement", value: true },
  },
  {
    fact: "basement_area_m2",
    kind: "number",
    unit: "m²",
    label: "Área ocupada do subsolo (m²)",
    ask: "Qual é a área ocupada do subsolo, em m²?",
    description:
      "Occupied floor area of the basement, in square meters. Asked only when the property has a basement.",
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "has_basement", value: true },
  },
  {
    fact: "basement_use",
    kind: "enum",
    label: "Ocupação do subsolo",
    ask: "O subsolo é usado como depósito, como local de reunião de público (F-1, F-3, F-5, F-6, F-10 ou F-11) ou para outra ocupação?",
    description:
      "storage for a warehouse; assembly for the divisions F-1, F-3, F-5, F-6, F-10 and F-11; other for anything else. Garages, car washes, changing rooms up to 100 m², toilets and unoccupied technical areas need no additional measures but are still answered as other. Asked only when the property has a basement.",
    options: [
      { value: "storage", label: "Depósito" },
      {
        value: "assembly",
        label: "Reunião de público (F-1, F-3, F-5, F-6, F-10, F-11)",
      },
      { value: "other", label: "Outra ocupação" },
    ],
    allowUnknown: true,
    askable: true,
    askAfter: { fact: "has_basement", value: true },
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
