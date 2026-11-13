import { DIVISION_G_1_2, fact, heightAtLeast } from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

const FACADES_SCOPE = "compartimentação de fachadas, shafts e dutos";
const BRIGADE = {
  kind: "info" as const,
  text: "Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).",
};

/**
 * Tabela 2, column "A-2, A-3, D, E e G", for Grupo G. Notes 2 and 6 read as for
 * Grupo C; note 1 is about brigades and needs its own reading.
 */
export const TABLE_2_G_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "A nota isenta de brigadistas apenas A-1, A-2 e J-1; o Grupo G não está entre eles.",
      },
    ],
    questions: [
      "A nota 1 diz que A-1, A-2 e J-1 são isentos de brigadistas. Como o Grupo G não está na lista, a brigada foi lida como exigida. Confirmar.",
    ],
  },
  ...TABLE_2_NOTES,
];

/** Tabela 13 (G-1, G-2 e G-5, área ≥ 750 m² ou altura ≥ 12 m): all five notes. */
export const TABLE_13_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [
      { kind: "require_when", when: { all: [] }, scope: FACADES_SCOPE },
    ],
    questions: [
      '"Exigido para compartimentação de fachadas, shafts e dutos" foi lido como a exigência limitada a esses elementos, não ao imóvel inteiro. Confirmar.',
    ],
  },
  {
    number: 3,
    effects: [
      {
        kind: "require_when",
        when: { all: [DIVISION_G_1_2, heightAtLeast(90)] },
      },
    ],
    questions: [
      'A nota diz "para G-1 e G-2 a partir de 90 m". Para G-5, que ela não cita, o controle de fumaça foi lido como não exigido.',
    ],
  },
  {
    number: 4,
    effects: [
      {
        kind: "require_when",
        when: fact("area_m2", "gte", 5000),
        scope:
          "áreas destinadas a estacionamento de veículos (exceto quando forem lateralmente abertas) e depósitos com carga de incêndio superior a 1.200 MJ/m²",
      },
    ],
    questions: [
      "A frase tem duas partes: edificações a partir de 5.000 m² com estacionamento, e depósitos com carga acima de 1.200 MJ/m². O código leu os dois locais como limitados às edificações de 5.000 m² ou mais. Confirmar.",
      '"exceto quando forem lateralmente abertas - observar IN 14": o código não avalia essa exceção; ela aparece só no texto da observação.',
    ],
  },
  {
    number: 5,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
];

/** Tabela 14 (G-3 e G-4, área ≥ 750 m² ou altura ≥ 12 m): all six notes. */
export const TABLE_14_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [{ kind: "require_when", when: fact("division", "eq", "G-4") }],
    questions: [],
  },
  {
    number: 3,
    effects: [
      {
        kind: "substitutable",
        by: ["sprinklers"],
        note: "Pode ser substituído por chuveiros automáticos.",
      },
    ],
    questions: [],
  },
  {
    number: 4,
    effects: [
      { kind: "require_when", when: { all: [] }, scope: FACADES_SCOPE },
    ],
    questions: [
      '"Exigido para compartimentação de fachadas, shafts e dutos" foi lido como a exigência limitada a esses elementos. Confirmar.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "depósitos e todos os locais com carga de incêndio superior a 1.200 MJ/m²",
      },
    ],
    questions: [
      'O "também" foi lido como a união dos dois conjuntos de locais (depósitos, e quaisquer locais acima de 1.200 MJ/m²). Confirmar.',
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
];
