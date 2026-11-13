import type { Condition } from "../engine/types";
import {
  I2,
  J1,
  J2,
  J3,
  J4,
  fact,
  heightAbove,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

const all = (...c: Condition[]): Condition => ({ all: c });
const any = (...c: Condition[]): Condition => ({ any: c });
const area = (op: "gt" | "gte", value: number): Condition =>
  fact("area_m2", op, value);
const storage = (value: number): Condition =>
  fact("storage_area_m2", "gte", value);
const ALL_ROOMS =
  "todos os ambientes (exceto banheiros e ambientes com carga de incêndio desprezível)";
const BRIGADE = {
  kind: "info" as const,
  text: "Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).",
};

/** Tabela 2, column "I, J e M3", for I and J: notes 1, 2 and 6. Note 1 exempts J-1 from brigades. */
export const TABLE_2_IJ_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      { kind: "exempt_when", when: J1 },
      {
        kind: "info",
        text: "A nota isenta de brigadistas A-1, A-2 e J-1.",
      },
    ],
    questions: [
      "A nota 1 isenta A-1, A-2 e J-1 de brigadistas. Para esta coluna foi lido que a brigada é dispensada para J-1 e exigida para as demais divisões de I e J. Confirmar.",
    ],
  },
  ...TABLE_2_NOTES.filter((n) => n.number === 2 || n.number === 6),
];

/** Tabela 18 (I-1 e I-2): all seven notes. */
export const TABLE_18_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [{ kind: "require_when", when: I2 }],
    questions: [],
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
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 5,
    effects: [
      {
        kind: "info",
        text: "Para ocupação I-1 aceita-se reservatório com volume a partir de 2.000 litros.",
      },
    ],
    questions: [],
  },
  {
    number: 6,
    effects: [
      { kind: "require_when", when: all(I2, area("gte", 5000)) },
      {
        kind: "info",
        text: "Para I-2, em todos os locais com carga de incêndio superior a 300 MJ/m² (texto da nota 6).",
      },
    ],
    questions: [
      'A nota 6 vale para a detecção automática e para o plano de emergência, mas a frase "em todos os locais com carga de incêndio superior a 300 MJ/m²" só faz sentido para a detecção. O código exige as duas para I-2 a partir de 5.000 m² e deixa essa frase como observação, sem limitar o local. Qual é a leitura correta?',
    ],
  },
  {
    number: 7,
    effects: [
      { kind: "require_when", when: I2 },
      {
        kind: "substitutable",
        by: ["sprinklers"],
        when: I2,
        note: "Exigido somente para I-2. Pode ser substituída por chuveiros automáticos.",
      },
    ],
    questions: [],
  },
];

/** Tabela 19 (I-3): all seven notes. */
export const TABLE_19_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa. Para I-3, além de brigadista orgânico, exige-se brigadista particular (ver IN 28).",
      },
    ],
    questions: [
      "O brigadista particular de I-3 aparece só como observação, não como exigência própria.",
    ],
  },
  {
    number: 2,
    effects: [{ kind: "require_when", when: area("gt", 10000) }],
    questions: [],
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
        by: ["smoke_control", "automatic_detection", "sprinklers"],
        note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [
      '"controle de fumaça, detecção e chuveiros automáticos" foi lido como os três sistemas juntos.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: any(all(heightAtMost(12), area("gte", 5000)), heightAbove(12)),
        scope: ALL_ROOMS,
      },
    ],
    questions: [
      '"Se altura até 12 m, exige-se se área a partir de 5.000 m²" foi lido como área maior ou igual a 5.000 m²; "se altura maior que 12 m, independente da área".',
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: area("gt", 20000) }],
    questions: [],
  },
];

/** Tabela 20 (J-1 e J-2): all nine notes. */
export const TABLE_20_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [{ kind: "exempt_when", when: J1 }, BRIGADE],
    questions: [
      '"J-1 está isento de brigada de incêndio" foi lido como a brigada exigida só para J-2.',
    ],
  },
  {
    number: 2,
    effects: [
      {
        kind: "require_when",
        when: any(
          all(J2, heightAtMost(30), storage(750)),
          all(J2, heightAbove(30), storage(500)),
        ),
      },
    ],
    questions: [
      "A nota usa a área de depósito, não a área total: J-2 até 30 m com depósito de 750 m² ou mais, e acima de 30 m com depósito de 500 m² ou mais. O código pergunta essa área ao usuário. Confirmar a leitura.",
    ],
  },
  {
    number: 3,
    effects: [
      { kind: "require_when", when: J2 },
      {
        kind: "substitutable",
        by: ["sprinklers"],
        when: J2,
        note: "Exigido apenas para J-2, pode ser substituída por chuveiros automáticos.",
      },
    ],
    questions: [],
  },
  {
    number: 4,
    effects: [
      {
        kind: "require_when",
        when: all(J1, area("gt", 750)),
        scope: "somente a compartimentação de fachada, shafts e dutos",
      },
    ],
    questions: [
      "As células x⁴⁻⁵ foram lidas como as notas 4 e 5 (e não um intervalo), porque assim as nove notas são citadas.",
    ],
  },
  {
    number: 5,
    effects: [
      { kind: "require_when", when: all(J2, area("gt", 500)) },
      {
        kind: "substitutable",
        by: ["smoke_control", "automatic_detection", "sprinklers"],
        when: all(J2, area("gt", 500)),
        note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [
      '"Apenas para J-2 com área maior que 500 m²" foi lido como a área total do imóvel, não a de depósito.',
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: all(J2, area("gte", 10000)) }],
    questions: [],
  },
  {
    number: 8,
    effects: [{ kind: "require_when", when: J2 }],
    questions: [],
  },
  {
    number: 9,
    effects: [
      {
        kind: "require_when",
        when: any(
          all(J2, heightAtMost(12), area("gte", 5000)),
          all(J2, heightAbove(12)),
        ),
        scope: ALL_ROOMS,
      },
    ],
    questions: [],
  },
];

/** Tabela 21 (J-3 e J-4): all eight notes. */
export const TABLE_21_NOTES: NoteSpec[] = [
  { number: 1, effects: [BRIGADE], questions: [] },
  {
    number: 2,
    effects: [{ kind: "require_when", when: all(J4, area("gte", 10000)) }],
    questions: [],
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
        by: ["smoke_control", "automatic_detection", "sprinklers"],
        note: "Pode ser substituída por controle de fumaça, detecção e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      },
    ],
    questions: [],
  },
  {
    number: 5,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: all(J3, storage(500)) }],
    questions: [
      "A nota usa a área de depósito, não a área total. O código pergunta essa área ao usuário.",
    ],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: { all: [] }, scope: ALL_ROOMS }],
    questions: [],
  },
  {
    number: 8,
    effects: [{ kind: "require_when", when: all(J4, area("gt", 20000)) }],
    questions: [],
  },
];
