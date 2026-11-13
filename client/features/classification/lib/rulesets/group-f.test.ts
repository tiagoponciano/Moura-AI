import { describe, expect, it } from "vitest";
import table2Json from "../../norms/in-1-p2/tables/table-02.json";
import table8Json from "../../norms/in-1-p2/tables/table-08.json";
import table9Json from "../../norms/in-1-p2/tables/table-09.json";
import table10Json from "../../norms/in-1-p2/tables/table-10.json";
import table11Json from "../../norms/in-1-p2/tables/table-11.json";
import table12Json from "../../norms/in-1-p2/tables/table-12.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import {
  boundarySamples,
  findDeriveOverlaps,
  lintRules,
} from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import {
  TABLE_10_SPEC,
  TABLE_11_SPEC,
  TABLE_12_SPEC,
  TABLE_2_F11_SPEC,
  TABLE_2_F9_SPEC,
  TABLE_2_F_MAIN_SPEC,
  TABLE_8_SPEC,
  TABLE_9_SPEC,
} from "./group-f";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const t = (j: unknown) => j as ExtractedTable;
const table2 = t(table2Json);

const venue = (overrides: Facts = {}): Facts => ({
  division: "F-1",
  area_m2: 3000,
  storeys: 4,
  height_m: 14,
  capacity_people: 300,
  ends_by_18h: false,
  windowless: false,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  ...overrides,
});
const run = (f: Facts) => evaluateRules(ALL_RULES, f, DATE);
const system = (f: Facts, id: string) =>
  run(f).systems.find((s) => s.id === id);
const level = (f: Facts) => {
  const r = run(f).risk;
  return r.status === "decided" ? r.level : r.status;
};
const tower = (height_m: number, o: Facts = {}) =>
  venue({ storeys: Math.ceil(height_m / 3), height_m, ...o });

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

describe("rule set with Grupo F", () => {
  it("is well formed and its derive rules never overlap", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    const derive = ALL_RULES.filter((r) => r.stage === "derive");
    const samples = boundarySamples(derive).flatMap((s) =>
      [1, 2, 3].map((storeys) => ({ ...s, storeys })),
    );
    expect(findDeriveOverlaps(ALL_RULES, samples, DATE)).toEqual([]);
  });

  it("encodes every note the cells cite", () => {
    expect(TABLE_2_F_MAIN_SPEC.notes.map((n) => n.number)).toEqual(
      [
        ...new Set([
          ...cited(table2, [3]),
          ...cited(table2, [4]),
          ...cited(table2, [5]),
        ]),
      ].sort((a, b) => a - b),
    );
    for (const [spec, json] of [
      [TABLE_8_SPEC, table8Json],
      [TABLE_9_SPEC, table9Json],
      [TABLE_10_SPEC, table10Json],
      [TABLE_11_SPEC, table11Json],
      [TABLE_12_SPEC, table12Json],
    ] as const) {
      const table = t(json);
      expect(spec.notes.map((n) => n.number)).toEqual(
        table.notes.map((n) => n.number),
      );
    }
    expect(TABLE_2_F9_SPEC.notes).toBe(TABLE_2_F11_SPEC.notes);
  });
});

describe("Grupo F: tables and notes", () => {
  it("names the table of each division", () => {
    for (const [division, table] of [
      ["F-1", 8],
      ["F-9", 9],
      ["F-6", 10],
      ["F-4", 11],
      ["F-11", 12],
    ] as const)
      expect(classify(venue({ division }), DATE).table).toContain(
        `Tabela ${table}`,
      );
  });

  it("uses the three columns of Tabela 2 for small buildings (notes 3 and 10)", () => {
    const small = { area_m2: 700, storeys: 1, height_m: 0 };
    const at = (division: string, capacity_people: number, id: string) =>
      system(venue({ ...small, division, capacity_people }), id)?.status;
    expect(at("F-5", 99, "emergency_exits")).toBe("required");
    expect(at("F-5", 99, "finishing_materials_control")).toBe("not_required");
    expect(at("F-5", 100, "finishing_materials_control")).toBe("required");
    expect(at("F-9", 100, "finishing_materials_control")).toBe("not_required");
    expect(at("F-5", 249, "low_voltage_installations")).toBe("not_required");
    expect(at("F-5", 250, "low_voltage_installations")).toBe("required");
    expect(at("F-9", 99, "low_voltage_installations")).toBe("not_required");
    expect(at("F-9", 100, "low_voltage_installations")).toBe("required");
  });

  it("asks for the capacity and decides by it (Tabela 8, note 8 and note 13)", () => {
    const f1 = (capacity_people?: number) =>
      venue({
        division: "F-1",
        storeys: 1,
        height_m: 0,
        ...(capacity_people === undefined
          ? { capacity_people: undefined }
          : { capacity_people }),
      });
    expect(system(f1(), "finishing_materials_control")?.status).toBe(
      "needs_info",
    );
    expect(system(f1(99), "finishing_materials_control")?.status).toBe(
      "not_required",
    );
    expect(system(f1(100), "finishing_materials_control")?.status).toBe(
      "required",
    );
    expect(system(f1(999), "emergency_plan")?.status).toBe("not_required");
    expect(system(f1(1000), "emergency_plan")?.status).toBe("required");
  });

  it("requires F-1 sprinklers from 30 m and never F-2 (Tabela 8, note 3)", () => {
    expect(system(tower(29.99), "sprinklers")?.status).not.toBe("required");
    expect(system(tower(31), "sprinklers")?.status).toBe("required");
    expect(system(tower(31, { division: "F-2" }), "sprinklers")?.status).toBe(
      "not_required",
    );
  });

  it("exempts the F-1 signage for a venue under 200 people that closes by 18h (Tabela 8, note 12)", () => {
    const ground = { storeys: 1, height_m: 0 };
    const sign = (capacity_people: number, ends_by_18h: boolean) =>
      system(
        venue({ ...ground, capacity_people, ends_by_18h }),
        "emergency_signage",
      )?.status;
    expect(sign(199, true)).toBe("not_required");
    expect(sign(200, true)).toBe("required");
    expect(sign(199, false)).toBe("required");
  });

  it("requires smoke control for F-1 from 90 m and F-2 above 12 m (Tabela 8, note 7)", () => {
    expect(system(tower(89.99), "smoke_control")?.status).toBe("not_required");
    expect(system(tower(90), "smoke_control")?.status).toBe("required");
    expect(
      system(tower(12.01, { division: "F-2" }), "smoke_control")?.status,
    ).toBe("required");
  });

  it("requires the F-9 elevator from 40 m (Tabela 9, note 6) and F-4 sprinklers from 10.000 m² (Tabela 11, note 2)", () => {
    expect(
      system(tower(39.99, { division: "F-9" }), "emergency_elevator")?.status,
    ).toBe("not_required");
    expect(
      system(tower(40, { division: "F-9" }), "emergency_elevator")?.status,
    ).toBe("required");
    const f4 = (area_m2: number) =>
      system(venue({ division: "F-4", area_m2 }), "sprinklers")?.status;
    expect(f4(9999)).toBe("not_required");
    expect(f4(10000)).toBe("required");
  });

  it("applies Tabela 10 notes: smoke control by capacity for F-5, F-6 and F-10 and by height for F-8 (note 4)", () => {
    const f = (division: string, o: Facts = {}) =>
      tower(20, { division, ...o });
    expect(
      system(f("F-5", { capacity_people: 1999 }), "smoke_control")?.status,
    ).toBe("not_required");
    expect(
      system(f("F-5", { capacity_people: 2000 }), "smoke_control")?.status,
    ).toBe("required");
    expect(
      system(f("F-8", { capacity_people: 5000 }), "smoke_control")?.status,
    ).toBe("not_required");
  });

  it("requires F-11 sprinklers from 3.000 people up to 30 m (Tabela 12, note 2)", () => {
    const f11 = (capacity_people: number) =>
      venue({ division: "F-11", storeys: 1, height_m: 0, capacity_people });
    expect(system(f11(2999), "sprinklers")?.status).toBe("not_required");
    expect(system(f11(3000), "sprinklers")?.status).toBe("required");
  });
});

describe("Grupo F: risk (Quadro 3)", () => {
  it.each([
    ["200 people", { capacity_people: 200 }, "III"],
    ["201 people", { capacity_people: 201 }, "IV"],
  ])("F-5 with %s", (_n, o, expected) => {
    expect(
      level(
        venue({
          division: "F-5",
          area_m2: 1000,
          storeys: 1,
          height_m: 0,
          ...o,
        }),
      ),
    ).toBe(expected);
  });
});

describe("Grupo F: scope", () => {
  it("stops at the boundary or several blocks", () => {
    for (const overrides of [
      { area_m2: 750, storeys: 2, height_m: 8 },
      { single_block: false },
    ])
      expect(classify(venue(overrides), DATE).status).toBe("analysis");
  });
});
