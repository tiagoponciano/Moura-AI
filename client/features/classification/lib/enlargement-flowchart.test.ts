import { describe, expect, it } from "vitest";
import {
  classifyEnlargement,
  type EnlargementInput,
  type Regime,
} from "./enlargement";

/**
 * IN 5, Annex A, the flowchart "Início da regularização de edificações EXISTENTES e
 * RECENTES", read leaf by leaf. Each case is one path from the start to a circle, with
 * the regime the circle names and the articles printed beside it. The articles in the
 * code follow the text of the instruction: the flowchart labels the "IN 1 para toda a
 * edificação" circle after 50% as "inc. III", but art. 19 has only incisos I and II,
 * and the one for a building with no compartmentation is II.
 */
const base: EnlargementInput = {
  division: "C-1",
  originalAreaM2: 1000,
  addedAreaM2: 0,
  originalRegularized: true,
  compartmented: false,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: false,
};

type Leaf = {
  path: string;
  input: Partial<EnlargementInput>;
  regime: Regime;
  article: string;
};

const LEAVES: Leaf[] = [
  // Did not enlarge the area (arts. 9 and 10)
  {
    path: "no enlargement, rigor rose",
    input: { raisesRigor: true },
    regime: "in1_all_unless_unfeasible",
    article: "art. 10",
  },
  {
    path: "no enlargement, rigor did not rise, regularized",
    input: { originalRegularized: true },
    regime: "keep_and_extend",
    article: "art. 9",
  },
  {
    path: "no enlargement, rigor did not rise, not regularized",
    input: { originalRegularized: false },
    regime: "in5_all",
    article: "art. 9, parágrafo único",
  },
  // Enlarged: a new isolated block (art. 13)
  {
    path: "enlarged, the enlargement is an isolated block",
    input: { addedAreaM2: 300, newIsolatedBlock: true },
    regime: "in1_all",
    article: "art. 13",
  },
  // Up to 20% (art. 15)
  {
    path: "up to 20%, regularized",
    input: { addedAreaM2: 150 },
    regime: "keep_and_extend",
    article: "art. 15, I",
  },
  {
    path: "up to 20%, not regularized",
    input: { addedAreaM2: 150, originalRegularized: false },
    regime: "in5_all",
    article: "art. 15, II",
  },
  // Between 20% and 50% (arts. 17 and 18)
  {
    path: "20 to 50%, rigor did not rise",
    input: { addedAreaM2: 400 },
    regime: "in5_all",
    article: "art. 17",
  },
  {
    path: "20 to 50%, rigor rose, no compartmentation",
    input: { addedAreaM2: 400, raisesRigor: true, compartmented: false },
    regime: "in1_all_unless_unfeasible",
    article: "art. 18, II",
  },
  {
    path: "20 to 50%, rigor rose, compartmented, regularized",
    input: {
      addedAreaM2: 400,
      raisesRigor: true,
      compartmented: true,
      originalRegularized: true,
    },
    regime: "in1_enlarged_only",
    article: "art. 18, I",
  },
  {
    path: "20 to 50%, rigor rose, compartmented, not regularized",
    input: {
      addedAreaM2: 400,
      raisesRigor: true,
      compartmented: true,
      originalRegularized: false,
    },
    regime: "in1_enlarged_only",
    article: "art. 18, I",
  },
  // More than 50% (art. 19)
  {
    path: "over 50%, no compartmentation",
    input: { addedAreaM2: 700, compartmented: false },
    regime: "in1_all",
    article: "art. 19, II",
  },
  {
    path: "over 50%, compartmented, regularized",
    input: { addedAreaM2: 700, compartmented: true, originalRegularized: true },
    regime: "in1_enlarged_only",
    article: "art. 19, I",
  },
  {
    path: "over 50%, compartmented, not regularized",
    input: {
      addedAreaM2: 700,
      compartmented: true,
      originalRegularized: false,
    },
    regime: "in1_enlarged_only",
    article: "art. 19, I",
  },
];

describe("IN 5 Annex A flowchart", () => {
  it.each(LEAVES)("$path", ({ input, regime, article }) => {
    const result = classifyEnlargement({ ...base, ...input });
    expect(result.regime).toBe(regime);
    expect(result.articles.some((a) => a.startsWith(article))).toBe(true);
  });

  it("tells the original area of a compartmented enlargement apart by its status (art. 18, I, alíneas a and b)", () => {
    const enlarged = {
      ...base,
      addedAreaM2: 400,
      raisesRigor: true,
      compartmented: true,
    };
    const regularized = classifyEnlargement({
      ...enlarged,
      originalRegularized: true,
    });
    const irregular = classifyEnlargement({
      ...enlarged,
      originalRegularized: false,
    });
    expect(regularized.original).toContain("mantém as características");
    expect(irregular.original).toContain("adequações da IN 5");
  });
});
