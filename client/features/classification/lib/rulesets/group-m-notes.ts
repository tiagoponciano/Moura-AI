import { fact, heightAbove } from "./group-c-conditions";
import type { Condition } from "../engine/types";
import type { NoteSpec } from "./types";

const always: Condition = { all: [] };
const note = (
  number: number,
  effects: NoteSpec["effects"],
  questions: string[] = [],
): NoteSpec => ({ number, effects, questions });

/** Tabela 23 (M-1, túnel): both notes. */
export const TABLE_23_NOTES: NoteSpec[] = [
  note(1, [
    {
      kind: "info",
      text: "Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).",
    },
  ]),
  note(
    2,
    [
      {
        kind: "info",
        text: "Exige-se em toda a extensão do túnel, em conjunto com monitoramento da concentração de monóxido de carbono (CO).",
      },
    ],
    [
      "A nota exige a detecção em toda a extensão do túnel e, em conjunto, o monitoramento de CO. O código lista a detecção e mostra o monitoramento de CO como observação, sem lista própria. Confirmar.",
    ],
  ),
];

const LOCATIONS_7 =
  "somente nos locais em que exista o acondicionamento de líquidos e gases combustíveis e inflamáveis";

/** Tabela 24 (M-2): all seven notes. */
export const TABLE_24_NOTES: NoteSpec[] = [
  note(1, [{ kind: "exempt_when", when: fact("hose_reach_60m", "eq", true) }]),
  note(2, [
    {
      kind: "info",
      text: "Exige-se brigadistas orgânicos (ver IN 28).",
    },
  ]),
  note(
    3,
    [{ kind: "require_when", when: fact("area_m2", "gte", 750) }],
    [
      'Nas células com mais de uma nota ("x 3_4", "x 3_7"), o código exige o sistema se qualquer uma das notas valer. A norma quer uma ou todas? Vale para "3_4" (área ≥ 750 m² ou altura > 12 m) e para "3_7".',
    ],
  ),
  note(4, [{ kind: "require_when", when: heightAbove(12) }]),
  note(5, [
    {
      kind: "info",
      text: "Luminárias de emergência à prova de explosão nas áreas de risco.",
    },
  ]),
  note(
    6,
    [{ kind: "require_when", when: fact("m2_liquid_m3", "gt", 0) }],
    [
      'A nota diz "somente para líquidos inflamáveis e combustíveis conforme IN específica". O código exige o sistema quando o volume de líquidos informado é maior que zero e não consulta a IN específica.',
    ],
  ),
  note(
    7,
    [{ kind: "require_when", when: always, scope: LOCATIONS_7 }],
    [
      "A nota restringe o sistema aos locais com acondicionamento de líquidos e gases. O código não avalia cada local: lista o sistema com esse escopo. Na célula com as notas 3 e 7, o sistema acaba exigido (em parte) mesmo abaixo de 750 m². Confirmar.",
    ],
  ),
];
