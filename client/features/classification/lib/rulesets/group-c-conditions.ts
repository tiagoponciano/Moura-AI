import type { Condition } from "../engine/types";

/** A comparison on one fact, shorter to write in rules. */
export const fact = <C extends Condition = Condition>(
  name: string,
  op: "lt" | "lte" | "gt" | "gte" | "eq" | "in",
  value: number | string | boolean | (number | string)[],
): C => ({ fact: name, op, value }) as C;

export const C2 = fact("division", "eq", "C-2");
export const C3 = fact("division", "eq", "C-3");
export const DIVISION_C = fact("division", "in", ["C-1", "C-2", "C-3"]);
export const DIVISION_D = fact("division", "in", ["D-1", "D-2", "D-3", "D-4"]);
export const DIVISION_E = fact("division", "in", [
  "E-1",
  "E-2",
  "E-3",
  "E-4",
  "E-5",
  "E-6",
]);
export const DIVISION_E_1_4 = fact("division", "in", [
  "E-1",
  "E-2",
  "E-3",
  "E-4",
]);
export const DIVISION_E_5_6 = fact("division", "in", ["E-5", "E-6"]);
export const DIVISION_G = fact("division", "in", [
  "G-1",
  "G-2",
  "G-3",
  "G-4",
  "G-5",
]);
export const DIVISION_G_1_2_5 = fact("division", "in", ["G-1", "G-2", "G-5"]);
export const DIVISION_G_1_2 = fact("division", "in", ["G-1", "G-2"]);
export const DIVISION_G_3_4 = fact("division", "in", ["G-3", "G-4"]);
export const DIVISION_B = fact("division", "in", ["B-1", "B-2"]);
export const A2 = fact("division", "eq", "A-2");
export const A3 = fact("division", "eq", "A-3");
export const DIVISION_A_2_3 = fact("division", "in", ["A-2", "A-3"]);
export const H1 = fact("division", "eq", "H-1");
export const H2 = fact("division", "eq", "H-2");
export const H3 = fact("division", "eq", "H-3");
export const H4 = fact("division", "eq", "H-4");
export const H5 = fact("division", "eq", "H-5");
export const H6 = fact("division", "eq", "H-6");
export const DIVISION_H = fact("division", "in", [
  "H-1",
  "H-2",
  "H-3",
  "H-4",
  "H-5",
  "H-6",
]);
/** The three sets of divisions of the tables by height of Grupo H. */
export const DIVISION_H_1_2_6 = fact("division", "in", ["H-1", "H-2", "H-6"]);
export const DIVISION_H_4_5 = fact("division", "in", ["H-4", "H-5"]);
/** The two columns of Tabela 2 for Grupo H. */
export const DIVISION_H_1_4_6 = fact("division", "in", ["H-1", "H-4", "H-6"]);
export const DIVISION_H_2_3_5 = fact("division", "in", ["H-2", "H-3", "H-5"]);
export const I2 = fact("division", "eq", "I-2");
export const J1 = fact("division", "eq", "J-1");
export const J2 = fact("division", "eq", "J-2");
export const J3 = fact("division", "eq", "J-3");
export const J4 = fact("division", "eq", "J-4");
export const DIVISION_I_J = fact("division", "in", [
  "I-1",
  "I-2",
  "I-3",
  "J-1",
  "J-2",
  "J-3",
  "J-4",
]);
export const F1 = fact("division", "eq", "F-1");
export const F2 = fact("division", "eq", "F-2");
export const F6 = fact("division", "eq", "F-6");
export const DIVISION_F = fact("division", "in", [
  "F-1",
  "F-2",
  "F-3",
  "F-4",
  "F-5",
  "F-6",
  "F-8",
  "F-9",
  "F-10",
  "F-11",
]);
export const DIVISION_F_1_2 = fact("division", "in", ["F-1", "F-2"]);
export const DIVISION_F_3_9 = fact("division", "in", ["F-3", "F-9"]);
export const DIVISION_F_5_6_8_10 = fact("division", "in", [
  "F-5",
  "F-6",
  "F-8",
  "F-10",
]);
export const DIVISION_F_MAIN = fact("division", "in", [
  "F-1",
  "F-2",
  "F-3",
  "F-4",
  "F-5",
  "F-6",
  "F-8",
  "F-10",
]);
export const DIVISION_I_1_2 = fact("division", "in", ["I-1", "I-2"]);
export const DIVISION_J_1_2 = fact("division", "in", ["J-1", "J-2"]);
export const DIVISION_J_3_4 = fact("division", "in", ["J-3", "J-4"]);
export const K1 = fact("division", "eq", "K-1");
export const K2 = fact("division", "eq", "K-2");
export const DIVISION_K = fact("division", "in", ["K-1", "K-2"]);
export const M1 = fact("division", "eq", "M-1");
export const M2 = fact("division", "eq", "M-2");
/** Every division that has rules loaded. */
const COVERED_DIVISION_IDS = [
  "A-2",
  "A-3",
  "B-1",
  "B-2",
  "C-1",
  "C-2",
  "C-3",
  "D-1",
  "D-2",
  "D-3",
  "D-4",
  "E-1",
  "E-2",
  "E-3",
  "E-4",
  "E-5",
  "E-6",
  "F-1",
  "F-2",
  "F-3",
  "F-4",
  "F-5",
  "F-6",
  "F-8",
  "F-9",
  "F-10",
  "F-11",
  "G-1",
  "G-2",
  "G-3",
  "G-4",
  "G-5",
  "H-1",
  "H-2",
  "H-3",
  "H-4",
  "H-5",
  "H-6",
  "I-1",
  "I-2",
  "I-3",
  "J-1",
  "J-2",
  "J-3",
  "J-4",
  "K-1",
  "K-2",
  "M-1",
  "M-2",
];
export const COVERED_DIVISIONS = fact("division", "in", COVERED_DIVISION_IDS);

/**
 * The scope guards a division can declare. Each one only makes sense when the
 * division is classified by the fact it checks.
 *   - boundary: the regime boundary (exactly 750 m² or 12 m); needs area and height.
 *   - multiple-blocks: the area depends on the isolation between blocks.
 *   - mixed-use: the systems follow arts. 11 and 12.
 */
export type ScopeGuardKey = "boundary" | "multiple-blocks" | "mixed-use";

/** Divisions classified by area and height: all three guards apply. */
const AREA_HEIGHT_GUARDS: readonly ScopeGuardKey[] = [
  "boundary",
  "multiple-blocks",
  "mixed-use",
];

/** Grupos K and M (Tabelas 22 to 24) are not split by area or height, so they have no regime boundary. */
const NO_REGIME_GUARDS: readonly ScopeGuardKey[] = [
  "multiple-blocks",
  "mixed-use",
];

/**
 * The guards each covered division declares. A new division lists only the
 * guards that fit its tables (K and M do not use area or height, so they do not
 * declare "boundary").
 */
export const DIVISION_SCOPE_GUARDS: Record<string, readonly ScopeGuardKey[]> =
  Object.fromEntries(
    COVERED_DIVISION_IDS.map((id) => [
      id,
      /^[KM]-/.test(id) ? NO_REGIME_GUARDS : AREA_HEIGHT_GUARDS,
    ]),
  );

/** The condition "division is one that declares this guard". */
export const declaresGuard = (key: ScopeGuardKey): Condition =>
  fact(
    "division",
    "in",
    Object.entries(DIVISION_SCOPE_GUARDS)
      .filter(([, keys]) => keys.includes(key))
      .map(([id]) => id),
  );

const singleStorey = fact("storeys", "eq", 1);
const manyStoreys = fact("storeys", "gt", 1);

/*
 * Height for the SMSCI tables is the distance from the lowest occupied floor to
 * the floor of the last storey, and a single-storey building has height 0
 * (IN 1 parte 2, art. 8 and its inciso V). So a single-storey building is below
 * and at most every height, and above none, whatever `height_m` says.
 */
export const heightBelow = (limit: number): Condition => ({
  any: [singleStorey, fact("height_m", "lt", limit)],
});
export const heightAtMost = (limit: number): Condition => ({
  any: [singleStorey, fact("height_m", "lte", limit)],
});
export const heightAbove = (limit: number): Condition => ({
  all: [manyStoreys, fact("height_m", "gt", limit)],
});
export const heightAtLeast = (limit: number): Condition => ({
  all: [manyStoreys, fact("height_m", "gte", limit)],
});

/** Tabela 2 applies to area ≤ 750 m² and height ≤ 12 m; the other tables to area ≥ 750 m² or height ≥ 12 m. */
export const AREA_LIMIT_M2 = 750;
export const HEIGHT_LIMIT_M = 12;

/** Strictly inside Tabela 2's range. */
export const REGIME_SMALL: Condition = {
  all: [fact("area_m2", "lt", AREA_LIMIT_M2), heightBelow(HEIGHT_LIMIT_M)],
};
/** Strictly beyond it, so the tables by height apply. */
export const REGIME_LARGE: Condition = {
  any: [fact("area_m2", "gt", AREA_LIMIT_M2), heightAbove(HEIGHT_LIMIT_M)],
};
/**
 * What is neither: exactly 750 m² (height at most 12 m) or exactly 12 m (area at
 * most 750 m²). Both tables claim these values, and the norm does not say which
 * wins, so the engine asks for a specific analysis.
 */
export const REGIME_BOUNDARY: Condition = {
  all: [
    fact("area_m2", "lte", AREA_LIMIT_M2),
    heightAtMost(HEIGHT_LIMIT_M),
    {
      any: [
        fact("area_m2", "gte", AREA_LIMIT_M2),
        heightAtLeast(HEIGHT_LIMIT_M),
      ],
    },
  ],
};

/** The columns of the tables by height, as conditions. A single-storey building is always "Térreo". */
type Classified = { id: string; label: string; when: Condition };

export const HEIGHT_CLASSES: Classified[] = [
  { id: "ground", label: "Térreo", when: singleStorey },
  {
    id: "h0_6",
    label: "H ≤ 6",
    when: { all: [manyStoreys, fact("height_m", "lte", 6)] },
  },
  {
    id: "h6_12",
    label: "6 < H ≤ 12",
    when: {
      all: [
        manyStoreys,
        fact("height_m", "gt", 6),
        fact("height_m", "lte", 12),
      ],
    },
  },
  {
    id: "h12_23",
    label: "12 < H ≤ 23",
    when: {
      all: [
        manyStoreys,
        fact("height_m", "gt", 12),
        fact("height_m", "lte", 23),
      ],
    },
  },
  {
    id: "h23_30",
    label: "23 < H ≤ 30",
    when: {
      all: [
        manyStoreys,
        fact("height_m", "gt", 23),
        fact("height_m", "lte", 30),
      ],
    },
  },
  {
    id: "h30p",
    label: "> 30",
    when: { all: [manyStoreys, fact("height_m", "gt", 30)] },
  },
];

/** Fire load classes of IN 3 art. 11, in MJ/m²; upper bounds are inclusive. */
export const FIRE_LOAD_CLASSES: Classified[] = [
  {
    id: "negligible",
    label: "Desprezível",
    when: fact("fire_load_mj_m2", "lte", 100),
  },
  {
    id: "low",
    label: "Baixa",
    when: {
      all: [
        fact("fire_load_mj_m2", "gt", 100),
        fact("fire_load_mj_m2", "lte", 300),
      ],
    },
  },
  {
    id: "medium",
    label: "Média",
    when: {
      all: [
        fact("fire_load_mj_m2", "gt", 300),
        fact("fire_load_mj_m2", "lte", 1200),
      ],
    },
  },
  {
    id: "high",
    label: "Alta",
    when: {
      all: [
        fact("fire_load_mj_m2", "gt", 1200),
        fact("fire_load_mj_m2", "lte", 2280),
      ],
    },
  },
  {
    id: "very_high",
    label: "Altíssima",
    when: fact("fire_load_mj_m2", "gt", 2280),
  },
];

/**
 * One occupation, or others that are only subsidiary (IN 1 parte 2, art. 10):
 * the systems of the predominant occupation then apply. Mixed and secondary
 * occupations are not covered.
 */
export const USE_IN_SCOPE: Condition = {
  any: [fact("single_use", "eq", true), fact("only_subsidiary", "eq", true)],
};
