import type { NoteSpec } from "./types";
import {
  C2,
  C3,
  fact,
  heightAbove,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";

const HIGH_LOAD = fact("fire_load_class", "in", ["high", "very_high"]);

/** Tabela 2, column C: the only notes the cells of Grupo C cite. */
export const TABLE_2_NOTES: NoteSpec[] = [
  {
    number: 2,
    effects: [{ kind: "require_when", when: fact("area_m2", "gte", 200) }],
    questions: [
      'A nota diz "área igual ou superior a 200m²". Confirmar que é a área total construída do imóvel (art. 7), não a área de um pavimento.',
    ],
  },
  {
    number: 6,
    effects: [
      { kind: "require_when", when: fact("storeys", "gte", 4) },
      {
        kind: "info",
        text: "Aceita-se reservatório com volume a partir de 2.000 litros.",
      },
    ],
    questions: [
      '"4 pavimentos ou mais": subsolos entram na contagem? O código conta os pavimentos informados pelo usuário.',
    ],
  },
];

const ATRIA_SCOPE =
  "átrios com altura superior a 12 m e corredores comunicantes utilizados como rota de fuga";
const ALL_ROOMS_SCOPE =
  "todos os ambientes (exceto banheiros e locais com carga de incêndio desprezível)";

/** Tabela 5 (Grupo C, área ≥ 750 m² ou altura ≥ 12 m): all twelve notes. */
export const TABLE_5_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa. Para C-3 exige-se também brigadista particular quando a área é a partir de 10.000 m² (ver IN 28).",
      },
    ],
    questions: [
      "A brigada é exigida sempre; o dimensionamento depende da população fixa e está na IN 28. O brigadista particular de C-3 a partir de 10.000 m² deve aparecer como exigência própria? Hoje aparece só como observação.",
    ],
  },
  {
    number: 2,
    effects: [
      {
        kind: "require_when",
        when: {
          any: [
            { all: [C2, fact("area_m2", "gt", 3000), HIGH_LOAD] },
            { all: [C3, fact("area_m2", "gt", 5000)] },
          ],
        },
      },
    ],
    questions: [
      'O "e" entre os dois casos entre parênteses foi lido como "ou": cada caso, sozinho, exige os chuveiros. Confirmar.',
    ],
  },
  {
    number: 3,
    effects: [
      { kind: "require_when", when: fact("division", "in", ["C-2", "C-3"]) },
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
      { kind: "require_when", when: fact("division", "in", ["C-2", "C-3"]) },
      {
        kind: "substitutable",
        by: ["automatic_detection"],
        when: { all: [C2, fact("fire_load_class", "eq", "medium")] },
        note: "C-2 com carga de incêndio média pode ser substituída por detecção automática.",
      },
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers"],
        when: { any: [{ all: [C2, HIGH_LOAD] }, C3] },
        note: "C-2 com carga de incêndio alta ou altíssima, e C-3, podem ser substituídas por detecção automática e chuveiros automáticos.",
      },
      {
        kind: "substitutable",
        by: ["smoke_control"],
        note: "A compartimentação de átrios pode ser substituída por controle de fumaça nos átrios, quando houver.",
      },
    ],
    questions: [
      'A nota não diz nada sobre C-2 com carga baixa ou desprezível. Como C-2 é "carga média, alta ou altíssima" na Tabela 1, foi lido como caso que não ocorre. Confirmar.',
      '"detecção automática e chuveiros automáticos" foi lido como os dois juntos.',
    ],
  },
  {
    number: 6,
    effects: [
      {
        kind: "substitutable",
        by: ["sprinklers"],
        note: "Pode ser substituída por chuveiros automáticos, exceto para a compartimentação de fachadas, shafts e dutos.",
      },
    ],
    questions: [],
  },
  {
    number: 7,
    effects: [
      { kind: "require_when", when: heightAtLeast(90) },
      {
        kind: "require_when",
        when: { all: [C3, heightAbove(12)] },
        scope: ATRIA_SCOPE,
      },
      {
        kind: "info",
        text: "Dispensados os pontos de chuveiros automáticos nesses locais, desde que a carga de incêndio seja inferior a 300 MJ/m².",
      },
    ],
    questions: [
      'A frase de C-3 tem mais de uma leitura: "C-3 com altura superior a 12 m, nos átrios com altura superior a 12 m e corredores comunicantes". Foi lida como: edificação C-3 acima de 12 m, exigida apenas nesses locais. Confirmar.',
      '"altura igual ou superior a 90 m" vale para C-1, C-2 e C-3 em todo o edifício.',
    ],
  },
  {
    number: 8,
    effects: [
      {
        kind: "require_when",
        when: fact("area_m2", "lte", 5000),
        scope:
          "locais destinados a depósito com mais de 500 m² e carga de incêndio superior a 300 MJ/m²",
      },
      {
        kind: "require_when",
        when: fact("area_m2", "gt", 5000),
        scope: ALL_ROOMS_SCOPE,
      },
    ],
    questions: [
      '"área até 5.000 m²" foi lido como menor ou igual, e "superior a 5.000 m²" como maior. Confirmar a fronteira de 5.000 m² exatos.',
    ],
  },
  {
    number: 9,
    effects: [
      {
        kind: "require_when",
        when: fact("area_m2", "lte", 5000),
        scope:
          "locais destinados a depósito com carga de incêndio superior a 300 MJ/m² e todos os locais com carga de incêndio superior a 1.200 MJ/m²",
      },
      {
        kind: "require_when",
        when: fact("area_m2", "gt", 5000),
        scope: ALL_ROOMS_SCOPE,
      },
    ],
    questions: [
      'No primeiro caso, o "e" foi lido como a união dos dois conjuntos de locais (depósitos acima de 300 MJ/m² e quaisquer locais acima de 1.200 MJ/m²). Confirmar.',
    ],
  },
  {
    number: 10,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 11,
    effects: [{ kind: "require_when", when: C3 }],
    questions: [],
  },
  {
    number: 12,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection", "sprinklers", "smoke_control"],
        when: heightAtMost(90),
        note: "Pode ser substituído por detecção automática, chuveiros automáticos e controle de fumaça até 90 m de altura, exceto para compartimentação de fachadas, shafts e dutos.",
      },
    ],
    questions: [
      '"até 90 m de altura" foi lido como menor ou igual a 90 m. Confirmar. Os três sistemas foram lidos como juntos.',
    ],
  },
];
