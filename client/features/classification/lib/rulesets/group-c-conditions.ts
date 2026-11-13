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
export const DIVISION_I_1_2 = fact("division", "in", ["I-1", "I-2"]);
export const DIVISION_J_1_2 = fact("division", "in", ["J-1", "J-2"]);
export const DIVISION_J_3_4 = fact("division", "in", ["J-3", "J-4"]);
/** Every division that has rules loaded. */
export const COVERED_DIVISIONS = fact("division", "in", [
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
]);

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
