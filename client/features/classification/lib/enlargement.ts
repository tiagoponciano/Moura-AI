/** Divisions the art. 16 exception does not cover (§ 1º). */
export const ART_16_EXCLUDED = [
  "I-3",
  "J-4",
  "F-1",
  "F-3",
  "F-5",
  "F-6",
  "F-8",
  "F-11",
];

export type EnlargementInput = {
  division: string;
  /** Original built area, in m², as art. 11 defines it. */
  originalAreaM2: number;
  /** What was added since the reference date of art. 11, summed (Nota 1, example 2). */
  addedAreaM2: number;
  /** The original area is regularized with the CBMSC. */
  originalRegularized: boolean;
  /** There is compartmentation between the original and the enlarged area. */
  compartmented: boolean;
  /** The enlargement made a new isolated block (art. 13). */
  newIsolatedBlock: boolean;
  /** At least 5 years since the habite-se of the original building (art. 12). */
  graceYearsMet: boolean;
  /** The enlargement raises the rigor of the IN 1 requirements (a threshold crossed, for example). */
  raisesRigor: boolean;
};

export type Regime =
  /** Everything follows IN 1, with no adaptation. */
  | "in1_all"
  /** Everything follows IN 1, but adaptable systems proven unfeasible may use IN 5. */
  | "in1_all_unless_unfeasible"
  /** The enlarged area follows IN 1; the original area is treated by its own status. */
  | "in1_enlarged_only"
  /** The whole building is regularized by IN 5. */
  | "in5_all"
  /** The systems installed are kept and extended to the enlarged area. */
  | "keep_and_extend";

export type EnlargementResult = {
  regime: Regime;
  /** Enlargement over the original area, as a fraction (0.2 is 20%). */
  ratio: number;
  /** What happens to the original area, in Portuguese for the screen. */
  original: string;
  /** What happens to the enlarged area. */
  enlarged: string;
  /** Articles the answer rests on. */
  articles: string[];
  notes: string[];
};

/**
 * How an enlargement of an existing building is regularized (IN 5, arts. 12 to 19).
 * The caller says whether the enlargement raises the rigor of IN 1; the function
 * only applies the articles. Provisional until Moura confirms the reading.
 */
export function classifyEnlargement(
  input: EnlargementInput,
): EnlargementResult {
  if (input.originalAreaM2 <= 0)
    throw new RangeError("original area must be positive");
  const ratio = input.addedAreaM2 / input.originalAreaM2;
  const result = (
    regime: Regime,
    original: string,
    enlarged: string,
    articles: string[],
    notes: string[] = [],
  ): EnlargementResult => ({
    regime,
    ratio,
    original,
    enlarged,
    articles,
    notes: [
      "A exigência dos sistemas considera a soma da área original e da ampliada, ainda que haja compartimentação (art. 14); havendo isolamento de risco, as áreas são autônomas.",
      ...notes,
    ],
  });

  if (!input.graceYearsMet) {
    return result(
      "in1_all",
      "Toda a edificação é regularizada pela IN 1.",
      "Toda a edificação é regularizada pela IN 1.",
      ["art. 12, § 1º"],
      ["A carência de 5 anos após o habite-se não foi cumprida."],
    );
  }
  if (input.newIsolatedBlock) {
    return result(
      "in1_all",
      "Segue o que já valia para a edificação original.",
      "O novo bloco isolado segue na íntegra a IN 1, sem adequações.",
      ["art. 13"],
    );
  }

  const art16 =
    input.originalRegularized &&
    ratio <= 0.2 &&
    !ART_16_EXCLUDED.includes(input.division);
  const raises = input.raisesRigor && !art16;
  const notes = [
    "Na área preexistente não se admitem dispensas ou adequações nos sistemas aprovados para a ocupação original (art. 12, § 2º).",
  ];
  if (art16 && input.raisesRigor) {
    notes.push(
      "Ultrapassar o limiar da IN 1 com ampliação de até 20% de uma edificação regularizada não conta como aumento do rigor (art. 16).",
    );
  }

  if (!raises && ratio <= 0.2) {
    return input.originalRegularized
      ? result(
          "keep_and_extend",
          "Os sistemas instalados são mantidos.",
          "Os sistemas instalados são estendidos à área ampliada, sem novos sistemas adequáveis.",
          ["art. 15, I", ...(art16 ? ["art. 16"] : [])],
          notes,
        )
      : result(
          "in5_all",
          "O imóvel por completo é regularizado com base na IN 5.",
          "O imóvel por completo é regularizado com base na IN 5.",
          ["art. 15, II"],
          notes,
        );
  }
  if (!raises && ratio <= 0.5) {
    return result(
      "in5_all",
      "Admite-se regularização com base na IN 5.",
      "Admite-se regularização com base na IN 5.",
      ["art. 17"],
      notes,
    );
  }

  const keptOrAdapted = input.originalRegularized
    ? "A área original, regularizada, mantém as características e a eficiência dos sistemas aprovados."
    : "A área original, existente e irregular, pode ser regularizada com as adequações da IN 5.";
  if (ratio <= 0.5) {
    return input.compartmented
      ? result(
          "in1_enlarged_only",
          keptOrAdapted,
          "A área ampliada atende a IN 1, com os sistemas definidos pela soma das áreas e instalados só nela. Adequáveis com inviabilidade comprovada podem seguir a IN 5.",
          ["art. 18, I e parágrafo único"],
          notes,
        )
      : result(
          "in1_all_unless_unfeasible",
          "Toda a edificação atende a IN 1.",
          "Toda a edificação atende a IN 1; adequáveis com inviabilidade comprovada podem seguir a IN 5.",
          ["art. 18, II e parágrafo único"],
          notes,
        );
  }
  return input.compartmented
    ? result(
        "in1_enlarged_only",
        keptOrAdapted,
        "A área ampliada atende a IN 1, com os sistemas definidos pela soma das áreas e instalados só nela.",
        ["art. 19, I"],
        notes,
      )
    : result(
        "in1_all",
        "Toda a edificação atende a IN 1, sem adequações.",
        "Toda a edificação atende a IN 1, sem adequações.",
        ["art. 19, II"],
        notes,
      );
}
