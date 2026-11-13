import {
  A2,
  A3,
  fact,
  heightAbove,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { Condition } from "../engine/types";
import type { NoteSpec } from "./types";

const heightBelow = (limit: number): Condition => ({
  any: [fact("storeys", "eq", 1), fact("height_m", "lt", limit)],
});

/**
 * Tabela 2, column "A-2, A-3, D, E e G", for A-2 and A-3. Notes 2 and 6 read as
 * for Grupo C; note 1 exempts A-2 from brigades.
 */
export const TABLE_2_A_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [
      { kind: "exempt_when", when: A2 },
      {
        kind: "info",
        text: "Para A-1 e A-2 recomenda-se a realização de capacitação EaD do CBMSC.",
      },
    ],
    questions: [
      "A nota 1 isenta A-1, A-2 e J-1 de brigadistas. Para esta coluna foi lido que a brigada é exigida para A-3 e dispensada para A-2. Confirmar.",
    ],
  },
  ...TABLE_2_NOTES,
];

const ATRIA = "átrios (quando houver)";
const SMOKE_SCOPE =
  "átrios com altura superior a 6 m e corredores comunicantes utilizados como rota de fuga";

/** Tabela 3, the A-2 and A-3 grid (area ≥ 750 m² or height ≥ 12 m): notes 1 to 10, 15, 16 and 17. */
export const TABLE_3_A23_NOTES: NoteSpec[] = [
  {
    number: 1,
    effects: [{ kind: "exempt_when", when: A2 }],
    questions: [
      '"A-2 está isento de brigadistas" foi lido como a brigada exigida só para A-3.',
    ],
  },
  {
    number: 2,
    effects: [{ kind: "require_when", when: heightAtLeast(100) }],
    questions: [],
  },
  {
    number: 3,
    effects: [
      {
        kind: "require_when",
        when: heightAbove(75),
        scope: "compartimentação entre as unidades autônomas",
      },
      {
        kind: "substitutable",
        by: ["sprinklers"],
        when: heightAtMost(150),
        note: "Pode ser substituído por chuveiros automáticos até 150 m de altura.",
      },
    ],
    questions: [
      '"altura superior a 75 m" foi lido como maior que 75 m, e "até 150 m" como menor ou igual a 150 m.',
    ],
  },
  {
    number: 4,
    effects: [
      { kind: "require_when", when: { all: [] }, scope: ATRIA },
      {
        kind: "substitutable",
        by: ["smoke_control"],
        note: "A compartimentação em átrios pode ser substituída por controle de fumaça somente nos átrios.",
      },
    ],
    questions: [
      '"Exigido somente nos átrios, quando houver" foi lido como a compartimentação vertical limitada aos átrios nessa faixa de altura. Confirmar.',
    ],
  },
  {
    number: 5,
    effects: [
      {
        kind: "require_when",
        when: { all: [A2, heightAtLeast(40), heightBelow(100)] },
        scope:
          "circulação de uso comum dos pavimentos e um ponto no interior dos apartamentos (próximo da entrada da unidade)",
      },
      {
        kind: "require_when",
        when: { all: [A2, heightAtLeast(100)] },
        scope:
          "circulação de uso comum dos pavimentos e interior dos apartamentos (nas cozinhas e nos cômodos onde as pessoas podem estar adormecidas)",
      },
      {
        kind: "require_when",
        when: { all: [A3, heightAtLeast(40)] },
        scope:
          "depósitos com carga de incêndio superior a 1.200 MJ/m², quartos, e cozinhas com fritadeiras ou com equipamentos à combustão de lenha ou carvão",
      },
    ],
    questions: [
      'A nota 5 diz que a detecção vale a partir de 40 m, e a nota 10 diz que, para A-2 com detecção, "a exigência se dá a partir de 60 m". A nota 10 foi lida como relativa à compartimentação vertical (não à detecção). Confirmar.',
      '"h ≥ 100 m" e "40 m ≤ h < 100 m" foram lidos como escritos, com os dois limites incluídos onde há "≥" e "≤".',
    ],
  },
  {
    number: 6,
    effects: [{ kind: "require_when", when: heightAtLeast(60) }],
    questions: [],
  },
  {
    number: 7,
    effects: [{ kind: "require_when", when: A3 }],
    questions: [],
  },
  {
    number: 8,
    effects: [
      {
        kind: "require_when",
        when: {
          any: [
            { all: [A3, heightAtLeast(30)] },
            { all: [A2, heightAtLeast(60)] },
          ],
        },
      },
    ],
    questions: [],
  },
  {
    number: 9,
    effects: [
      {
        kind: "substitutable",
        by: ["automatic_detection"],
        when: heightAtMost(40),
        note: "Pode ser substituído por detecção automática de incêndio para edificações com até 40 m de altura. Havendo átrios, a compartimentação em átrios pode ser substituída por controle de fumaça somente nos átrios.",
      },
    ],
    questions: [],
  },
  {
    number: 10,
    effects: [
      {
        kind: "substitutable",
        by: ["sprinklers"],
        when: heightAtMost(100),
        note: "A compartimentação pode ser substituída por chuveiros automáticos para edificações com até 100 m de altura. Havendo átrios, a compartimentação no átrio pode ser substituída por controle de fumaça somente nos átrios.",
      },
      {
        kind: "info",
        text: "Para os imóveis A-2 com detecção automática de incêndio, a exigência se dá a partir de 60 m de altura.",
      },
    ],
    questions: [
      'A frase "para os imóveis A-2 com detecção automática de incêndio, a exigência se dá a partir de 60 m de altura" foi lida como informação: ela condiciona a exigência da compartimentação a uma instalação que o código não pergunta. Como a Moura quer tratar isso?',
    ],
  },
  {
    number: 15,
    effects: [{ kind: "exempt_when", when: heightAtMost(12) }],
    questions: [
      '"Somente para edificações com altura superior a 12 metros" foi lido como a dispensa até 12 m, combinada com a nota 16.',
    ],
  },
  {
    number: 16,
    effects: [
      {
        kind: "require_when",
        when: A2,
        scope: "áreas comuns",
      },
      { kind: "require_when", when: A3 },
    ],
    questions: [
      '"Ocupação A-2 exige-se somente para áreas comuns" foi lido como a exigência de A-2 limitada às áreas comuns, e a de A-3 sem limite.',
    ],
  },
  {
    number: 17,
    effects: [
      {
        kind: "require_when",
        when: {
          any: [{ all: [A2, heightAbove(90)] }, { all: [A3, heightAbove(60)] }],
        },
        scope: SMOKE_SCOPE,
      },
      {
        kind: "info",
        text: "Garagens e estacionamentos devem dispor de sistema de ventilação e exaustão conforme Código de Obras do Município, caso exista previsão. Caso não haja previsão, observar o artigo 24 da IN 10.",
      },
    ],
    questions: [
      "As exigências para garagens e estacionamentos (ventilação e exaustão pelo Código de Obras ou pelo art. 24 da IN 10) aparecem só como observação, sem serem avaliadas.",
    ],
  },
];
