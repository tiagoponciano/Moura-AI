import type { Condition } from "../engine/types";
import { fact, heightAtLeast } from "./group-c-conditions";
import type { NoteSpec } from "./types";

const always: Condition = { all: [] };
const note = (
  number: number,
  effects: NoteSpec["effects"],
  questions: string[] = [],
): NoteSpec => ({ number, effects, questions });
const BRIGADE = {
  kind: "info" as const,
  text: "Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).",
};
const requirements = (text: string) => ({ kind: "info" as const, text });

/** Tabela 25 (M-3, área ≥ 750 m² ou altura ≥ 12 m): all seven notes. */
export const TABLE_25_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(2, [
    {
      kind: "substitutable",
      by: ["Sistema de gases, com supressão total do ambiente"],
      note: "Pode ser substituído por sistemas de gases, através da supressão total do ambiente.",
    },
  ]),
  note(3, [{ kind: "require_when", when: heightAtLeast(60) }]),
  note(
    4,
    [
      requirements(
        "É dispensada a instalação nos locais, áreas ou pavimentos em que existam equipamentos elétro-eletrônicos com sistema de gases para combate a incêndio.",
      ),
    ],
    [
      "A nota dispensa o sistema hidráulico só nos locais com equipamentos protegidos por gases. O código não avalia cada local e mantém o sistema exigido, com o texto da nota como observação. Confirmar.",
    ],
  ),
  note(5, [
    {
      kind: "require_when",
      when: fact("gas_suppression_system", "eq", true),
    },
  ]),
  note(
    6,
    [
      requirements(
        "Escada pressurizada para imóveis que possuam altura igual ou superior a 30 m.",
      ),
    ],
    [
      "A nota 6 está na coluna acima de 30 m e fala em altura igual ou superior a 30 m. O código mostra o texto como observação e não cria uma exigência separada de escada pressurizada. Confirmar.",
    ],
  ),
  note(
    7,
    [
      {
        kind: "require_when",
        when: always,
        scope:
          "somente em centro de processamento de dados, locais com geradores, banco de baterias ou nobreaks, locais com equipamentos de comunicação e transmissão de dados sem supervisão de pessoas e salas elétricas",
      },
    ],
    [
      "A nota restringe a detecção a certos locais. O código não avalia cada local: lista o sistema com esse escopo.",
    ],
  ),
];

/** Tabela 26 (M-4 and M-7): all five notes. */
export const TABLE_26_NOTES: NoteSpec[] = [
  note(1, [
    requirements(
      "Para ocupações subsidiárias, verificar SMSCI específicos para a ocupação.",
    ),
  ]),
  note(2, [BRIGADE]),
  note(
    3,
    [
      requirements(
        "Conforme IN específica (IN 22 sobre pátio de contêineres).",
      ),
    ],
    [
      "A nota remete à IN 22 (pátio de contêineres), que o código não consulta. O sistema hidráulico fica exigido para M-7.",
    ],
  ),
  note(4, [
    requirements(
      "Para M-4: aceitam-se as próprias saídas da edificação, podendo as escadas ser do tipo NE. Para M-7: aceitam-se os arruamentos entre as quadras de armazenamento conforme IN específica.",
    ),
  ]),
  note(5, [{ kind: "require_when", when: fact("isotank_total_m3", "gt", 20) }]),
];

const IN34 = (norm: string) => `Atenderá os requisitos da ${norm} e da IN 34.`;

/** Tabela 27 (M-5, silo): all six notes. */
export const TABLE_27_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(2, [requirements(IN34("IN 6"))]),
  note(3, [
    { kind: "require_when", when: fact("silo_support_area_m2", "gte", 750) },
    requirements("Atenderá os requisitos das IN 7 e 34."),
  ]),
  note(4, [requirements(IN34("IN 11"))]),
  note(5, [requirements(IN34("IN 9"))]),
  note(
    6,
    [requirements(IN34("IN 13"))],
    [
      "A nota 6 não é citada por nenhuma célula do PDF (a linha da IN 13 parece faltar). O código a carrega só como texto.",
    ],
  ),
];

/** Tabela 28 (M-6, área de plantio): both notes. */
export const TABLE_28_NOTES: NoteSpec[] = [
  note(1, [BRIGADE]),
  note(2, [
    requirements(
      "O plano de emergência deve contemplar o plano de regulação de material combustível e ações de apoio às operações de combate a incêndios, sendo competência do responsável técnico o seu dimensionamento.",
    ),
  ]),
];

/** Tabela 29 (M-11, estufas): both notes. */
export const TABLE_29_NOTES: NoteSpec[] = [
  note(1, [
    { kind: "require_when", when: fact("greenhouse_uses_gas", "eq", true) },
  ]),
  note(2, [{ kind: "require_when", when: fact("area_m2", "gt", 300) }]),
];
