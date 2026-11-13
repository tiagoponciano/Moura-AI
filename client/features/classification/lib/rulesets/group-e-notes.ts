import {
  DIVISION_E_1_4,
  DIVISION_E_5_6,
  fact,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

/**
 * Tabela 2, column "A-2, A-3, D, E e G", for Grupo E. Notes 2 and 6 read as for
 * Grupo C; note 1 is about brigades and needs its own reading.
 */
export const TABLE_2_E_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "A nota isenta de brigadistas apenas A-1, A-2 e J-1; o Grupo E não está entre eles.",
      },
    ],
    questions: [
      "A nota 1 diz que A-1, A-2 e J-1 são isentos de brigadistas. Como o Grupo E não está na lista, a brigada foi lida como exigida. Confirmar.",
    ],
  },
  ...TABLE_2_NOTES,
];

const DETECTORS_SCOPE =
  "depósitos com carga de incêndio superior a 300 MJ/m² e todos os locais com carga de incêndio superior a 1.200 MJ/m²";

/** Tabela 7 (Grupo E, área ≥ 750 m² ou altura ≥ 12 m): all thirteen notes. */
export const TABLE_7_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "require_when",
        when: {
          any: [
            DIVISION_E_5_6,
            { all: [DIVISION_E_1_4, fact("area_m2", "gte", 1500)] },
          ],
        },
      },
    ],
    questions: [
      "A nota só fala de E-1 a E-4 com área a partir de 1.500 m². Para E-5 e E-6, que ela não cita, o alarme foi lido como exigido sem condição de área.",
    ],
  },
  {
    number: 2,
    effects: [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa do imóvel (IN 28).",
      },
    ],
    questions: [],
  },
  {
    number: 3,
    effects: [{ kind: "require_when", when: heightAtLeast(75) }],
    questions: [],
  },
  {
    number: 4,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        note: "Pode ser substituído por detecção automática e chuveiro automático.",
      },
    ],
    questions: [
      '"detecção automática e chuveiro automático" foi lido como os dois sistemas juntos. Confirmar que não basta um deles.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope: "no mínimo a compartimentação de fachadas, shafts e dutos",
      },
    ],
    questions: [
      '"No mínimo a compartimentação de fachadas, shaft e dutos" foi lido como a exigência limitada a esses elementos, não ao imóvel inteiro. Confirmar.',
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(90) }],
    questions: [],
  },
  {
    number: 7,
    effects: [
      {
        kind: "require_when",
        when: {
          any: [
            { all: [DIVISION_E_5_6, fact("area_m2", "gt", 750)] },
            { all: [DIVISION_E_1_4, fact("area_m2", "gt", 5000)] },
          ],
        },
        scope: DETECTORS_SCOPE,
      },
      {
        kind: "info",
        text: "Exceto para E-5 e E-6, considera-se para efeitos de dispensa a compartimentação entre blocos, não sendo necessário o isolamento entre os blocos.",
      },
    ],
    questions: [
      "O código usa a área total informada. A nota diz que, para E-1 a E-4, a dispensa considera a compartimentação entre blocos, sem exigir isolamento. Como a Moura quer contar a área nesse caso?",
      '"acima de 750 m²" e "acima de 5.000 m²" foram lidos como maior que, sem incluir o valor exato.',
    ],
  },
  {
    number: 8,
    effects: [
      {
        kind: "exempt_when",
        when: {
          all: [
            fact("storeys", "lte", 2),
            fact("classrooms_exit_outside", "eq", true),
          ],
        },
      },
    ],
    questions: [
      '"térreas ou com no máximo 2 pavimentos" foi lido como até 2 pavimentos. "A maior parte das salas de aula com saída direta para área externa aberta" vem de uma pergunta de sim ou não ao usuário.',
    ],
  },
  {
    number: 9,
    effects: [{ kind: "require_when", when: heightAtLeast(90) }],
    questions: [],
  },
  {
    number: 10,
    effects: [
      {
        kind: "info",
        text: "Nas ocupações E-1, quando apontadas ocorrências de vandalismo, admite-se a alocação dos extintores no interior das salas de aula ou em locais protegidos distribuídos pela edificação.",
      },
    ],
    questions: [],
  },
  {
    number: 11,
    effects: [{ kind: "require_when", when: DIVISION_E_5_6 }],
    questions: [],
  },
  {
    number: 12,
    effects: [
      {
        kind: "substitutable",
        by: ["smoke_control", "sprinklers", "automatic_detection"],
        when: heightAtMost(90),
        note: "Pode ser substituído por controle de fumaça, chuveiros automáticos e detecção automática até 90 m de altura, exceto para a compartimentação de fachadas, shafts e dutos de instalações.",
      },
    ],
    questions: [
      '"até 90 m de altura" foi lido como menor ou igual a 90 m. Os três sistemas foram lidos como juntos.',
    ],
  },
  {
    number: 13,
    effects: [
      {
        kind: "info",
        text: "Dispensado para E-3 subsidiários a ocupações dos grupos A e B.",
      },
    ],
    questions: [
      "A nota 13 dispensa o elevador de emergência para E-3 subsidiário de A e B. Como uma ocupação subsidiária vai hoje para análise específica, essa dispensa não é avaliada. Confirmar.",
    ],
  },
];
