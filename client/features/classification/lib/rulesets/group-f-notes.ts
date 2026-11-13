import type { Condition } from "../engine/types";
import {
  F1,
  F2,
  F6,
  fact,
  heightAbove,
  heightAtLeast,
  heightAtMost,
} from "./group-c-conditions";
import { TABLE_2_NOTES } from "./group-c-notes";
import type { NoteSpec } from "./types";

const all = (...c: Condition[]): Condition => ({ all: c });
const any = (...c: Condition[]): Condition => ({ any: c });
const capacityAtLeast = (value: number): Condition =>
  fact("capacity_people", "gte", value);
const ALL_ROOMS =
  "todos os ambientes (exceto banheiros e locais com carga de incêndio desprezível)";
const DETECTION_ROOMS =
  "locais com carga de incêndio superior a 300 MJ/m²; locais com forro falso de revestimento combustível; depósitos, escritórios, cozinhas, pisos técnicos e casa de máquinas; ambientes com equipamentos elétricos de sonorização e iluminação";
const BRIGADE = {
  kind: "info" as const,
  text: "Exige-se brigadistas orgânicos de acordo com a população fixa (ver IN 28).",
};
const PRIVATE_BRIGADE_QUESTION =
  "O brigadista particular aparece só como observação, não como exigência própria.";
const FACADE_SCOPE = "somente fachadas, shafts e dutos";
const PUBLIC_1000 =
  'A nota diz "locais com público igual ou superior a 1.000 pessoas". O código usa a lotação total do imóvel. Quando o imóvel tem vários locais de reunião, vale a lotação de cada local?';
const PUBLIC_QUESTION = PUBLIC_1000;
const NOT_NEGLIGIBLE =
  'A frase "carga de incêndio desprezível" não é avaliada por local: o texto fica como escopo da exigência.';

const sub = (by: string[], note: string, when?: Condition) => ({
  kind: "substitutable" as const,
  by,
  note,
  ...(when && { when }),
});
const require = (when: Condition, scope?: string) => ({
  kind: "require_when" as const,
  when,
  ...(scope && { scope }),
});
const note = (
  number: number,
  effects: NoteSpec["effects"],
  questions: string[] = [],
): NoteSpec => ({ number, effects, questions });

/** Tabela 2, the three columns of Grupo F: notes 1, 3, 4, 6, 7, 8, 9 and 10. */
export const TABLE_2_F_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(3, [require(capacityAtLeast(100))]),
  note(
    4,
    [
      require(all(capacityAtLeast(500), fact("windowless", "eq", true))),
      sub(
        ["sprinklers"],
        "Pode ser substituído por chuveiros automáticos de resposta rápida com reserva de incêndio para 30 minutos.",
      ),
    ],
    [
      'A nota exige o controle de fumaça com lotação a partir de 500 pessoas se a edificação for considerada sem janelas. O código pergunta se não tem janelas e aceita "não sei". Quem decide o que é "sem janelas"?',
    ],
  ),
  TABLE_2_NOTES.find((n) => n.number === 6)!,
  note(7, [require(any(capacityAtLeast(50), fact("storeys", "gte", 2)))]),
  note(8, [require(F6)]),
  note(
    9,
    [
      {
        kind: "info",
        text: "A saída de emergência é vital para F-5, F-6, F-8 e F-11.",
      },
    ],
    [
      "A nota 9 diz que as saídas são vitais só para F-5, F-6, F-8 e F-11, mas o PDF marca (V) na coluna inteira de F-1 a F-8 e F-10. O código segue o (V) impresso. Qual vale?",
    ],
  ),
  note(10, [require(capacityAtLeast(250))]),
];

/** Tabela 8 (F-1 e F-2): all fourteen notes. */
export const TABLE_8_NOTES: NoteSpec[] = [
  note(1, [
    {
      kind: "info",
      text: "Não se considera para cômputo de altura: torres, campanários e assemelhados, que não se constituam em locais de habitação fixa.",
    },
  ]),
  note(
    2,
    [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa. Para F-1, além de brigadista orgânico, exige-se brigadista particular.",
      },
    ],
    [PRIVATE_BRIGADE_QUESTION],
  ),
  note(3, [require(all(F1, heightAtLeast(30)))]),
  note(
    4,
    [
      require(F1),
      sub(
        ["sprinklers"],
        "Para F-1 pode ser substituída por chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
        F1,
      ),
    ],
    [
      "As células x⁴⁻⁵ foram lidas como as notas 4 e 5 (e não um intervalo), porque assim as catorze notas são citadas.",
    ],
  ),
  note(5, [require(F2, FACADE_SCOPE)]),
  note(
    6,
    [
      sub(
        ["automatic_detection", "sprinklers"],
        "Pode ser substituída por detecção automática e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
      ),
    ],
    [
      '"detecção automática e chuveiros automáticos" foi lido como os dois juntos.',
    ],
  ),
  note(7, [require(any(all(F1, heightAtLeast(90)), all(F2, heightAbove(12))))]),
  note(8, [require(capacityAtLeast(100))]),
  note(9, [require(F1, ALL_ROOMS)]),
  note(
    10,
    [require(F1, ALL_ROOMS), require(F2, DETECTION_ROOMS)],
    [NOT_NEGLIGIBLE],
  ),
  note(11, [require(heightAtLeast(60))]),
  note(
    12,
    [
      {
        kind: "exempt_when",
        when: all(
          fact("capacity_people", "lt", 200),
          fact("ends_by_18h", "eq", true),
        ),
      },
    ],
    [
      '"Isento para imóveis com lotação inferior a 200 pessoas com funcionamento até as 18:00h": o código pede a lotação e se o funcionamento termina às 18h.',
    ],
  ),
  note(13, [require(capacityAtLeast(1000))], [PUBLIC_QUESTION]),
  note(
    14,
    [
      sub(
        ["automatic_detection", "sprinklers", "smoke_control"],
        "Pode ser substituída por detecção automática, chuveiros automáticos e controle de fumaça para edificações com até 90 m de altura, exceto para compartimentação de fachada, shafts e dutos.",
        heightAtMost(90),
      ),
    ],
    ["Os três sistemas foram lidos como juntos."],
  ),
];

/** Tabela 9 (F-3 e F-9): all seven notes. */
export const TABLE_9_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(2, [
    require({
      all: [],
    }, "apenas áreas internas com carga de incêndio (não em arquibancadas, piscinas, banheiros e vestiários, por exemplo)"),
  ]),
  note(3, [require({ all: [] }, FACADE_SCOPE)]),
  note(4, [
    sub(
      ["automatic_detection", "smoke_control", "sprinklers"],
      "Pode ser substituída por detecção automática, controle de fumaça e chuveiro automático, exceto para compartimentação de fachada, shafts e dutos.",
    ),
  ]),
  note(5, [require({ all: [] }, DETECTION_ROOMS)], [NOT_NEGLIGIBLE]),
  note(6, [require(heightAtLeast(40))]),
  note(7, [require(capacityAtLeast(1000))], [PUBLIC_QUESTION]),
];

/** Tabela 10 (F-5, F-6, F-8 e F-10): all twelve notes. */
export const TABLE_10_NOTES: NoteSpec[] = [
  note(
    1,
    [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com a população fixa. Para F-6, além de brigadista orgânico, exige-se brigadista particular (ver IN 28).",
      },
    ],
    [PRIVATE_BRIGADE_QUESTION],
  ),
  note(2, [
    require(
      any(
        fact("division", "in", ["F-5", "F-6", "F-10"]),
        all(fact("division", "eq", "F-8"), heightAbove(12)),
      ),
    ),
    sub(
      ["automatic_detection", "sprinklers"],
      "Pode ser substituído por detecção automática e chuveiros automáticos.",
    ),
  ]),
  note(3, [
    sub(
      ["smoke_control", "sprinklers"],
      "Pode ser substituída por controle de fumaça e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
    ),
  ]),
  note(4, [
    require(
      any(
        all(
          fact("division", "in", ["F-5", "F-6", "F-10"]),
          capacityAtLeast(2000),
        ),
        all(fact("division", "eq", "F-8"), heightAtLeast(60)),
      ),
    ),
  ]),
  note(5, [require(capacityAtLeast(100))]),
  note(6, [require({ all: [] }, DETECTION_ROOMS)], [NOT_NEGLIGIBLE]),
  note(7, [require(heightAtLeast(40))]),
  note(8, [
    {
      kind: "exempt_when",
      when: all(
        fact("capacity_people", "lt", 200),
        fact("ends_by_18h", "eq", true),
      ),
    },
  ]),
  note(
    9,
    [
      {
        kind: "info",
        text: "Saída de emergência vital apenas para F-5, F-6 e F-8.",
      },
    ],
    ["A nota 9 limita o (V) a F-5, F-6 e F-8; o código segue o (V) impresso."],
  ),
  note(10, [require(capacityAtLeast(1000))], [PUBLIC_QUESTION]),
  note(
    11,
    [
      {
        kind: "info",
        text: "Dispensado para salões de festas subsidiários à ocupação A-2, se não for exigido chuveiros automáticos para a edificação.",
      },
    ],
    [
      "A dispensa para salão de festas subsidiário a A-2 não é avaliada: o texto fica como observação. É preciso perguntar?",
    ],
  ),
  note(
    12,
    [
      {
        kind: "info",
        text: "Dispensado para salões de festas subsidiários a qualquer ocupação com lotação máxima de até 100 pessoas.",
      },
    ],
    [
      "A célula do elevador traz x⁷⁻¹², que o código leu como as notas 7 e 12 (elevador a partir de 40 m); a nota 12 fala em salão de festas e fica como observação. Confirmar o que a nota 12 quer dizer nessa célula.",
    ],
  ),
];

/** Tabela 11 (F-4): all eight notes. */
export const TABLE_11_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(2, [require(fact("area_m2", "gte", 10000))]),
  note(3, [require({ all: [] }, FACADE_SCOPE)]),
  note(4, [
    sub(
      ["automatic_detection", "smoke_control", "sprinklers"],
      "Pode ser substituída por detecção automática, controle de fumaça e chuveiro automático, exceto para compartimentação de fachada, shafts e dutos.",
    ),
  ]),
  note(5, [require(capacityAtLeast(2000))], [PUBLIC_QUESTION]),
  note(6, [require({ all: [] }, DETECTION_ROOMS)], [NOT_NEGLIGIBLE]),
  note(7, [require(heightAtLeast(40))]),
  note(8, [require(capacityAtLeast(1000))], [PUBLIC_QUESTION]),
];

/** Tabela 12 (F-11): all ten notes. */
export const TABLE_12_NOTES: NoteSpec[] = [
  note(
    1,
    [
      {
        kind: "info",
        text: "Exige-se brigadistas orgânicos de acordo com população fixa e lotação. Para F-11, além de brigadista orgânico, exige-se brigadista particular (ver IN 28).",
      },
    ],
    [PRIVATE_BRIGADE_QUESTION],
  ),
  note(2, [require(capacityAtLeast(3000))]),
  note(3, [
    sub(
      ["automatic_detection", "sprinklers"],
      "Pode ser substituída por detecção de incêndio e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
    ),
  ]),
  note(4, [
    sub(
      ["smoke_control", "automatic_detection", "sprinklers"],
      "Pode ser substituída por controle de fumaça, detecção de incêndio e chuveiros automáticos, exceto para compartimentação de fachada, shafts e dutos.",
    ),
  ]),
  note(5, [
    sub(
      ["sprinklers"],
      "Para lotação acima de 500 pessoas, pode ser substituído por chuveiros automáticos de resposta rápida.",
      fact("capacity_people", "gt", 500),
    ),
  ]),
  note(
    6,
    [require(heightAtLeast(60))],
    [
      'A célula do controle de fumaça acima de 30 m traz x⁵⁻⁶, e a nota 6 diz "a partir de 60 m de altura". O código leu como: acima de 30 m só se exige a partir de 60 m. Mas a nota pode ser sobre a substituição por chuveiros. Qual é a leitura certa?',
    ],
  ),
  note(7, [require({ all: [] }, DETECTION_ROOMS)], [NOT_NEGLIGIBLE]),
  note(
    8,
    [
      require({
        all: [],
      }, "locais com carga de incêndio superior a 100 MJ/m²; locais com forro falso de revestimento combustível; depósitos, escritórios, cozinhas, pisos técnicos e casa de máquinas; ambientes com equipamentos elétricos de sonorização e iluminação"),
    ],
    [NOT_NEGLIGIBLE],
  ),
  note(9, [require(heightAtLeast(40))]),
  note(
    10,
    [require(capacityAtLeast(500))],
    [PUBLIC_QUESTION.replace("1.000", "500")],
  ),
];
