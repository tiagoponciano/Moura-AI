import type { Condition } from "../engine/types";
import {
  H2,
  H4,
  H5,
  H6,
  heightAbove,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

const BRIGADE = {
  kind: "info" as const,
  text: "Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).",
};
const any = (...c: Condition[]): Condition => ({ any: c });
const all = (...c: Condition[]): Condition => ({ all: c });

/** Tabela 2, the two columns of Grupo H: only notes 2 and 6 are cited, read as for Grupo C. */
export const TABLE_2_H_NOTES: NoteSpec[] = TABLE_2_NOTES.filter(
  (n) => n.number === 2 || n.number === 6,
);

/** Tabela 15 (H-1, H-2 e H-6): all eleven notes. */
export const TABLE_15_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [
      { kind: "require_when", when: H6 },
      {
        kind: "substitutable",
        by: ["automatic_detection"],
        when: H6,
        note: "Para H-6 pode ser substituído por detecção automática de incêndio.",
      },
    ],
    questions: [
      '"Dispensado para H-1 e H-2" foi lido como a compartimentação horizontal exigida só para H-6 nessas colunas.',
    ],
  },
  {
    number: 3,
    effects: [
      {
        kind: "require_when",
        when: H2,
        scope: "compartimentação para unidades autônomas",
      },
      { kind: "require_when", when: H6 },
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        when: all(H6, heightAtMost(30)),
        note: "Para H-6 pode ser substituído por detecção e chuveiros automáticos até 30 m.",
      },
    ],
    questions: [
      '"detecção e chuveiros automáticos" foi lido como os dois sistemas juntos, e "até 30 m" como menor ou igual a 30 m.',
    ],
  },
  {
    number: 4,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        note: "Pode ser substituída por detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [
      '"detecção e chuveiros automáticos" foi lido como os dois sistemas juntos.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "substitutable",
        by: ["smoke_control"],
        when: H6,
        note: "A compartimentação em átrios pode ser substituída por controle de fumaça nos átrios para divisão H-6, quando houver.",
      },
    ],
    questions: [
      "As células x⁴⁻⁵ foram lidas como as notas 4 e 5 (e não um intervalo), porque assim as onze notas são citadas.",
    ],
  },
  {
    number: 6,
    effects: [
      {
        kind: "substitutable",
        by: ["smoke_control", "automatic_detection", "sprinklers"],
        when: heightAtMost(90),
        note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos para até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [],
  },
  {
    number: 7,
    effects: [
      {
        kind: "require_when",
        when: any(all(H2, heightAbove(30)), all(H6, heightAtLeast(90))),
      },
    ],
    questions: [
      '"Isento para H-1" foi lido como a exigência só para H-2 acima de 30 m e H-6 a partir de 90 m.',
    ],
  },
  {
    number: 8,
    effects: [
      {
        kind: "require_when",
        when: H2,
        scope:
          "locais com carga de incêndio superior a 1.200 MJ/m² e nos quartos",
      },
      {
        kind: "require_when",
        when: H6,
        scope: "locais com carga de incêndio superior a 1.200 MJ/m²",
      },
    ],
    questions: [],
  },
  {
    number: 9,
    effects: [
      {
        kind: "require_when",
        when: any(H2, H6),
        scope:
          "locais com carga de incêndio superior a 1.200 MJ/m², quartos, depósitos e lavanderias",
      },
    ],
    questions: [],
  },
  {
    number: 10,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 11,
    effects: [{ kind: "require_when", when: any(H2, H6) }],
    questions: [],
  },
];

/** Tabela 16 (H-3): all eight notes. */
export const TABLE_16_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "somente as regras específicas de compartimentação entre unidades autônomas",
      },
    ],
    questions: [
      '"Para edificações com até 2 pavimentos devem ser atendidas somente as regras específicas de compartimentação entre unidades autônomas" foi lido como a exigência limitada a essas regras, na coluna Térrea.',
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
        kind: "require_when",
        when: { all: [] },
        scope: "selagem de shafts e dutos",
      },
    ],
    questions: [],
  },
  {
    number: 5,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers", "smoke_control"],
        when: heightAtMost(90),
        note: "Pode ser substituída por detecção automática, chuveiros automáticos e controle de fumaça para edificações com até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [
      'Os três sistemas foram lidos como juntos, e "até 90 m" como menor ou igual a 90 m.',
    ],
  },
  {
    number: 6,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "todos os locais com carga de incêndio superior a 300 MJ/m²; quartos com leito; depósitos, cozinhas, lavanderias e casa de máquinas",
      },
    ],
    questions: [],
  },
  {
    number: 7,
    effects: [
      {
        kind: "require_when",
        when: { all: [] },
        scope:
          "todos os ambientes (exceto banheiros e ambientes com carga de incêndio desprezível)",
      },
    ],
    questions: [],
  },
  {
    number: 8,
    effects: [{ kind: "require_when", when: heightAtLeast(21) }],
    questions: [
      "Na coluna de 12 a 23 m a nota exige o elevador a partir de 21 m; nas colunas seguintes a célula não tem condição.",
    ],
  },
];

/** Tabela 17 (H-4 e H-5): all eight notes. */
export const TABLE_17_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [{ kind: "require_when", when: all(H4, heightAtLeast(100)) }],
    questions: [
      "A nota exige os chuveiros só para H-4 a partir de 100 m; para H-5, que ela não cita, foram lidos como não exigidos.",
    ],
  },
  {
    number: 3,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        note: "Pode ser substituída por detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [],
  },
  {
    number: 4,
    effects: [
      {
        kind: "require_when",
        when: any(all(H5, heightAbove(30)), all(H4, heightAtLeast(90))),
      },
    ],
    questions: [],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: H4,
        scope: "depósitos com carga de incêndio superior a 300 MJ/m²",
      },
      {
        kind: "require_when",
        when: H5,
        scope:
          "quartos e todos os locais com carga de incêndio superior a 1.200 MJ/m² (em hospitais psiquiátricos e assemelhados, também depósitos, escritórios, cozinhas, lavanderias, pisos técnicos, casa de máquinas etc.)",
      },
    ],
    questions: [
      "A nota amplia os locais para hospitais psiquiátricos e assemelhados. O código não pergunta isso: o texto fica no escopo e vale como observação.",
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: H5 }],
    questions: [],
  },
  {
    number: 8,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers", "smoke_control"],
        when: heightAtMost(90),
        note: "Pode ser substituída por detecção automática, chuveiros automáticos e controle de fumaça para edificações com até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [],
  },
];
