import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table7Json from "../../norms/in-1-p2/tables/table-07.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_2_E_SPEC, TABLE_7_SPEC } from "./group-e";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table2 = table2Json as unknown as ExtractedTable;
const table7 = table7Json as unknown as ExtractedTable;

/** A Grupo E building inside the scope of the tables. */
const school = (overrides: Facts = {}): Facts => ({
  division: "E-1",
  area_m2: 1800,
  storeys: 2,
  height_m: 9,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  classrooms_exit_outside: false,
  ...overrides,
});

const run = (facts: Facts) => evaluateRules(ALL_RULES, facts, DATE);
const system = (facts: Facts, id: string) =>
  run(facts).systems.find((s) => s.id === id);
const level = (facts: Facts) => {
  const r = run(facts).risk;
  return r.status === "decided" ? r.level : r.status;
};

describe("rule set with Grupos C, D and E", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the Grupo E cells cite, including the ones in multi-reference cells", () => {
    const cited = (table: ExtractedTable, columns: number[]) =>
      [
        ...new Set(
          table.rows.flatMap((r) =>
            columns.flatMap((c) =>
              r.cells[c].mark === "x" ? r.cells[c].refs : [],
            ),
          ),
        ),
      ].sort((a, b) => a - b);
    expect(TABLE_2_E_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table2, [0]),
    );
    expect(TABLE_7_SPEC.notes.map((n) => n.number)).toEqual(
      cited(table7, [0, 1, 2, 3, 4, 5]),
    );
    expect(TABLE_7_SPEC.notes.map((n) => n.number)).toEqual(
      table7.notes.map((n) => n.number),
    );
  });
});

describe("Grupo E: small buildings (Tabela 2)", () => {
  it("requires the same printed systems as the other groups of the shared column", () => {
    const required = run(school({ area_m2: 700 }))
      .systems.filter((s) => s.status === "required")
      .map((s) => s.id)
      .sort();
    expect(required).toEqual(
      [
        "combustible_gas",
        "emergency_exits",
        "emergency_lighting",
        "emergency_signage",
        "extinguishers",
        "fire_brigade",
        "low_voltage_installations",
      ].sort(),
    );
  });
});

describe("Grupo E: large buildings (Tabela 7)", () => {
  it("requires the alarm for E-1 to E-4 from 1.500 m² and for E-5 and E-6 whatever the area (note 1)", () => {
    expect(system(school({ area_m2: 1499.99 }), "fire_alarm")?.status).toBe(
      "not_required",
    );
    expect(system(school({ area_m2: 1500 }), "fire_alarm")?.status).toBe(
      "required",
    );
    expect(
      system(school({ division: "E-5", area_m2: 800 }), "fire_alarm")?.status,
    ).toBe("required");
  });

  it("requires the emergency plan only for E-5 and E-6 up to 23 m (note 11)", () => {
    expect(system(school(), "emergency_plan")?.status).toBe("not_required");
    expect(
      system(school({ division: "E-6", area_m2: 800 }), "emergency_plan")
        ?.status,
    ).toBe("required");
  });

  it("requires sprinklers from 75 m (note 3), and the elevator and smoke control from 90 m (notes 9 and 6)", () => {
    const tower = (height_m: number) =>
      school({ area_m2: 3000, storeys: 25, height_m });
    expect(system(tower(74.99), "sprinklers")?.status).toBe("not_required");
    expect(system(tower(75), "sprinklers")?.status).toBe("required");
    expect(system(tower(89.99), "emergency_elevator")?.status).toBe(
      "not_required",
    );
    expect(system(tower(90), "emergency_elevator")?.status).toBe("required");
    expect(system(tower(90), "smoke_control")?.status).toBe("required");
  });

  it("limits vertical compartmentation to facades, shafts and ducts (note 5)", () => {
    const vertical = system(
      school({ area_m2: 3000, storeys: 5, height_m: 15 }),
      "vertical_compartmentation",
    )!;
    expect(vertical).toMatchObject({ status: "required", partial: true });
    expect(vertical.scopes[0]).toContain("fachadas, shafts e dutos");
  });

  it("requires detection above 5.000 m² for E-1 to E-4 and above 750 m² for E-5 and E-6, in the rooms of note 7", () => {
    const tall = { storeys: 3, height_m: 10 };
    expect(
      system(school({ ...tall, area_m2: 5000 }), "automatic_detection")?.status,
    ).toBe("not_required");
    const over = system(
      school({ ...tall, area_m2: 5000.01 }),
      "automatic_detection",
    )!;
    expect(over).toMatchObject({ status: "required", partial: true });
    expect(over.scopes[0]).toContain(
      "depósitos com carga de incêndio superior a 300 MJ/m²",
    );
    expect(
      system(
        school({ ...tall, division: "E-5", area_m2: 750 }),
        "automatic_detection",
      )?.status,
    ).toBe("not_required");
    expect(
      system(
        school({ ...tall, division: "E-5", area_m2: 750.01 }),
        "automatic_detection",
      )?.status,
    ).toBe("required");
  });

  describe("the classroom exemption (note 8), only for up to two storeys", () => {
    // The cell cites note 8 only in the columns up to 6 m.
    const big = { area_m2: 6000, storeys: 2, height_m: 5 };

    it("exempts a school whose classrooms open outdoors", () => {
      expect(
        system(
          school({ ...big, classrooms_exit_outside: true }),
          "automatic_detection",
        )?.status,
      ).toBe("not_required");
    });

    it("requires detection when they do not", () => {
      expect(
        system(
          school({ ...big, classrooms_exit_outside: false }),
          "automatic_detection",
        )?.status,
      ).toBe("required");
    });

    it("waits for the answer, and asks it", () => {
      const facts = school({ ...big, classrooms_exit_outside: undefined });
      expect(system(facts, "automatic_detection")?.status).toBe("needs_info");
      expect(classify(facts, DATE).nextQuestions.map((q) => q.fact)).toContain(
        "classrooms_exit_outside",
      );
    });

    it("does not apply, or ask, above two storeys", () => {
      const facts = school({
        ...big,
        storeys: 3,
        height_m: 6,
        classrooms_exit_outside: undefined,
      });
      expect(system(facts, "automatic_detection")?.status).toBe("required");
      expect(
        classify(facts, DATE).nextQuestions.map((q) => q.fact),
      ).not.toContain("classrooms_exit_outside");
    });
  });
});

describe("Grupo E: risk (the two rows of Quadro 2)", () => {
  it.each([
    [
      "E-1 up to 21 m and 5.000 m²",
      { height_m: 21, storeys: 7, area_m2: 5000 },
      "III",
    ],
    ["E-1 above 21 m", { height_m: 21.01, storeys: 7, area_m2: 1000 }, "IV"],
    ["E-1 above 5.000 m²", { height_m: 8, storeys: 2, area_m2: 5000.01 }, "IV"],
    [
      "E-5 up to 12 m and 750 m², with 4 storeys",
      { division: "E-5", height_m: 12, storeys: 4, area_m2: 750 },
      "III",
    ],
    [
      "E-5 above 750 m²",
      { division: "E-5", height_m: 11, storeys: 4, area_m2: 750.01 },
      "IV",
    ],
    [
      "E-5 above 12 m",
      { division: "E-5", height_m: 12.01, storeys: 4, area_m2: 700 },
      "IV",
    ],
  ])("%s", (_name, overrides, expected) => {
    expect(level(school(overrides))).toBe(expected);
  });

  it("is II for a small school", () => {
    expect(level(school({ area_m2: 700 }))).toBe("II");
  });
});

describe("Grupo E: scope", () => {
  it("is not asked about storage, and stops at the boundary, several blocks or mixed use", () => {
    expect(
      classify(school({ area_m2: 700 }), DATE).nextQuestions.map((q) => q.fact),
    ).not.toContain("storage_over_3_5m");
    for (const overrides of [
      { area_m2: 750 },
      { single_block: false },
      { single_use: false },
    ]) {
      expect(classify(school(overrides), DATE).status).toBe("analysis");
    }
  });

  it("names Tabela 7 for a large school", () => {
    expect(classify(school(), DATE).table).toBe("Tabela 7, coluna 6 < H ≤ 12");
  });
});
