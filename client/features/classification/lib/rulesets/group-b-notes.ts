import { heightAbove, heightAtLeast, heightAtMost } from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

/**
 * Tabela 2, column B, for Grupo B: notes 2, 5 and 6. Notes 2 and 6 read as for
 * Grupo C; note 5 is about detection in the bedrooms.
 */
export const TABLE_2_B_NOTES: NoteSpec[] = [
  ...TABLE_2_NOTES.filter((n) => n.number === 2),
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "os quartos (admitem-se detectores autônomos sem necessidade do sistema de alarme)",
      },
    ],
    questions: [
      '"Exigido para os quartos" foi lido como a detecção limitada aos quartos, e os detectores autônomos como uma forma aceita de atender, sem mudar a exigência. Confirmar.',
    ],
  },
  ...TABLE_2_NOTES.filter((n) => n.number === 6),
];

const SMOKE_SCOPE_ATRIA =
  "átrios com altura superior a 6 m e corredores comunicantes utilizados como rota de fuga";
const SMOKE_SCOPE_HIGH =
  "também os corredores de circulação até a escada de segurança, a área de refúgio ou a área externa, e salas ou compartimentos maiores que 300 m²";

/** Tabela 4 (Grupo B, área ≥ 750 m² ou altura ≥ 12 m): all seven notes. */
export const TABLE_4_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa, observar IN 28.",
      },
    ],
    questions: [],
  },
  {
    number: 2,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope: "somente a compartimentação entre as unidades autônomas",
      },
    ],
    questions: [
      '"Somente compartimentação entre as unidades autônomas" foi lido como a exigência limitada a essa compartimentação. Confirmar.',
    ],
  },
  {
    number: 3,
    effects: [
      {
        kind: "substitutable",
        by: ["sprinklers"],
        note: "Pode ser substituída por chuveiros automáticos.",
      },
    ],
    questions: [],
  },
  {
    number: 4,
    effects: [
      {
        kind: "substitutable",
        by: ["smoke_control", "sprinklers"],
        when: heightAtMost(90),
        note: "Pode ser substituído por controle de fumaça e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos em imóveis com altura até 90 m.",
      },
    ],
    questions: [
      '"controle de fumaça e chuveiros automáticos" foi lido como os dois sistemas juntos. A exceção (fachada, shafts e dutos) vale "em imóveis com altura até 90 m", e o código só mostra a substituição até 90 m. Confirmar.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: heightAbove(30),
        scope: SMOKE_SCOPE_ATRIA,
      },
      {
        kind: "require_when",
        when: heightAtLeast(90),
        scope: SMOKE_SCOPE_HIGH,
      },
    ],
    questions: [
      'Acima de 30 m o controle de fumaça foi lido como exigido nos átrios acima de 6 m e nos corredores de rota de fuga; a partir de 90 m, também nos corredores até a escada, a área de refúgio ou a área externa e nas salas acima de 300 m². Confirmar que o "também" soma os locais.',
    ],
  },
  {
    number: 6,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "todos os ambientes (exceto banheiros e locais com carga de incêndio desprezível)",
      },
    ],
    questions: [],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
];
