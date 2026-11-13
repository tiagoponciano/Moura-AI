import { heightAtLeast, heightAtMost } from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

/**
 * Tabela 2, column "A-2, A-3, D, E e G", for Grupo D. Notes 2 and 6 read as for
 * Grupo C; note 1 is about brigades and needs its own reading.
 */
export const TABLE_2_D_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "A nota isenta de brigadistas apenas A-1, A-2 e J-1; o Grupo D não está entre eles.",
      },
    ],
    questions: [
      "A nota 1 diz que A-1, A-2 e J-1 são isentos de brigadistas. Como o Grupo D não está na lista, a brigada foi lida como exigida. Confirmar.",
    ],
  },
  ...TABLE_2_NOTES,
];

/** Tabela 6 (Grupo D, área ≥ 750 m² ou altura ≥ 12 m): all ten notes. */
export const TABLE_6_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).",
      },
    ],
    questions: [],
  },
  {
    number: 2,
    effects: [{ kind: "require_when", when: heightAtLeast(45) }],
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
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        note: "Pode ser substituído por detecção automática e chuveiros automáticos.",
      },
    ],
    questions: [
      '"detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos. Confirmar que não basta um deles.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection"],
        note: "Pode ser substituída por detecção automática.",
      },
    ],
    questions: [],
  },
  {
    number: 6,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        note: "Pode ser substituída por detecção automática e chuveiros automáticos.",
      },
    ],
    questions: [
      '"detecção automática e chuveiros automáticos" foi lido como os dois sistemas juntos.',
    ],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: heightAtLeast(90) }],
    questions: [],
  },
  {
    number: 8,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 9,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "smoke_control", "sprinklers"],
        when: heightAtMost(90),
        note: "Pode ser substituída por detecção automática, controle de fumaça e chuveiro automático até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [
      '"até 90 m de altura" foi lido como menor ou igual a 90 m. Os três sistemas foram lidos como juntos.',
    ],
  },
  {
    number: 10,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "locais destinados a depósito com carga de incêndio superior a 300 MJ/m² e em todos os locais com carga de incêndio superior a 1.200 MJ/m²",
      },
    ],
    questions: [
      'O "e" foi lido como a união dos dois conjuntos de locais (depósitos acima de 300 MJ/m² e quaisquer locais acima de 1.200 MJ/m²). Confirmar.',
    ],
  },
];
