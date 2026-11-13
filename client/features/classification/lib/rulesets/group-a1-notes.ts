import { fact } from "./group-c-conditions";
import type { NoteSpec } from "./types";

const note = (
  number: number,
  effects: NoteSpec["effects"],
  questions: string[] = [],
): NoteSpec => ({ number, effects, questions });

/** Tabela 3, the A-1 grid: the notes its cells and its heading cite (11 to 14 and 18). */
export const TABLE_3_A1_NOTES: NoteSpec[] = [
  note(11, [
    {
      kind: "info",
      text: "Isolamento é exigido apenas entre as unidades geminadas/conjugadas. Para as não geminadas/conjugadas é dispensado independente do afastamento entre as unidades.",
    },
  ]),
  note(12, [
    { kind: "require_when", when: fact("shared_gas_shelter", "eq", true) },
  ]),
  note(
    13,
    [
      {
        kind: "info",
        text: "A unidade unifamiliar em edificação mista, situada em altura superior a 6 m, deve atender às exigências da Tabela 2 ou 3 (assemelhando-se a A-2) ou da ocupação predominante, a que for mais rigorosa.",
      },
    ],
    [
      'A nota remete, acima de 6 m, à Tabela 2 ou 3 (como A-2) ou à ocupação predominante, a mais rigorosa. O código não compara as duas: responde "análise específica" para a unidade mista acima de 6 m. Confirmar.',
    ],
  ),
  note(
    14,
    [
      {
        kind: "info",
        text: "Igual ao da ocupação predominante.",
      },
    ],
    [
      "A proteção estrutural da unifamiliar mista é a da ocupação predominante, que o código não consulta: o sistema fica exigido, com essa observação. Confirmar.",
    ],
  ),
  note(
    18,
    [{ kind: "require_when", when: fact("lot_count", "gt", 350) }],
    [
      'A nota diz "mais de 350 lotes". O código lê como maior que 350 e usa o número de lotes previstos informado.',
    ],
  ),
];
