import type { Condition } from "../engine/types";
import { fact, heightAtLeast } from "./group-c-conditions";
import type { NoteSpec } from "./types";

const always: Condition = { all: [] };
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

const HIGH_FIRE_LOAD = fact("fire_load_class", "in", ["high", "very_high"]);
const FIRE_LOAD_SCOPE =
  "somente locais com carga de incêndio maior que 1.200 MJ/m², locais de armazenamento de combustíveis, casa de máquinas e caldeiras";
const PER_PLACE_QUESTION =
  "A nota fala em locais, não no imóvel inteiro. O código exige o sistema quando a carga de incêndio informada é alta ou altíssima e mostra o texto como escopo. Confirmar a leitura.";

/** Tabela 22 (Grupo K, K-1 e K-2): all ten notes. */
export const TABLE_22_NOTES: NoteSpec[] = [
  note(1, [
    { kind: "exempt_when", when: fact("public_road_within_50m", "eq", true) },
  ]),
  note(
    2,
    [
      require(fact("solid_fuel_storage_m2", "gt", 750)),
      {
        kind: "info",
        text: "Para imóvel que armazena combustíveis líquidos, consultar norma específica.",
      },
    ],
    [
      "A nota exige o sistema só para armazenamento de combustíveis sólidos acima de 750 m². Para líquidos, remete a uma norma específica, que o código não consulta. Confirmar a leitura.",
    ],
  ),
  note(3, [
    {
      kind: "info",
      text: "Exige-se brigadistas orgânicos de acordo com população fixa (ver IN 28).",
    },
  ]),
  note(4, [require(heightAtLeast(60))]),
  note(
    5,
    [require(always, FIRE_LOAD_SCOPE)],
    [
      "A nota vale só para as áreas edificadas de K-2, nos ambientes com carga de incêndio maior que 1.200 MJ/m², nos locais de armazenamento de combustíveis e na casa de máquinas e caldeiras. O código lista o sistema com esse escopo e não avalia cada ambiente.",
    ],
  ),
  note(6, [require(heightAtLeast(40))]),
  note(
    7,
    [require(fact("combustible_liquid_storage", "eq", true))],
    [
      'A nota 7 aparece na Espuma (K-2 termoelétrica) e também em todas as colunas de Proteção estrutural. O código aplica "se houver local de armazenamento de líquidos combustíveis" às duas; para Proteção estrutural isso pode ser uma nota deslocada no PDF. Qual vale?',
    ],
  ),
  note(
    8,
    [
      {
        kind: "substitutable",
        by: [
          "Sistema fixo automatizado para transformadores e reatores de potência (NBR 13231)",
        ],
        note: "Na ocupação K-1 pode ser substituído por sistema fixo automatizado para transformadores e reatores de potência conforme NBR 13231.",
      },
    ],
    [
      'A nota 8 aparece na Espuma e no Resfriamento de K-1 acima de 20 m³ e diz só "pode ser substituído". O código vale a substituição para os dois. Confirmar.',
    ],
  ),
  note(
    9,
    [require(HIGH_FIRE_LOAD, FIRE_LOAD_SCOPE)],
    [
      PER_PLACE_QUESTION,
      'A célula cita as notas 2 e 9 ("x²⁻ 9"); o código leu como as duas notas, e o sistema é exigido se qualquer uma valer. Era uma lista ou um intervalo?',
    ],
  ),
  note(10, [require(HIGH_FIRE_LOAD, FIRE_LOAD_SCOPE)], [PER_PLACE_QUESTION]),
];
