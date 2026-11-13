import { describe, expect, it } from "vitest";
import table23Json from "../../norms/in-1-p2/tables/table-23.json";
import table24Json from "../../norms/in-1-p2/tables/table-24.json";
import { classify } from "../classify";
import { evaluateCondition } from "../engine/condition";
import { evaluateRules } from "../engine/evaluate-rules";
import { lintRules } from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_23_SPEC, TABLE_24_SPEC } from "./group-m";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const t = (j: unknown) => j as ExtractedTable;

const common: Facts = {
  area_m2: 500,
  storeys: 1,
  height_m: 0,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  hose_reach_60m: false,
};
const tunnel = (tunnel_length_m: number, o: Facts = {}): Facts => ({
  ...common,
  division: "M-1",
  tunnel_length_m,
  ...o,
});
const tank = (o: Facts = {}): Facts => ({
  ...common,
  division: "M-2",
  m2_installation: "tanks_processes",
  m2_liquid_m3: 10,
  m2_gas_quantity: 0,
  ...o,
});
const run = (f: Facts) => evaluateRules(ALL_RULES, f, DATE);
const status = (f: Facts, id: string) =>
  run(f).systems.find((s) => s.id === id)?.status;

describe("Grupo M rules", () => {
  it("are well formed", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
  });

  it("encode every note of Tabelas 23 and 24", () => {
    for (const [spec, json] of [
      [TABLE_23_SPEC, table23Json],
      [TABLE_24_SPEC, table24Json],
    ] as const)
      expect(spec.notes.map((n) => n.number)).toEqual(
        t(json).notes.map((n) => n.number),
      );
  });

  it("names the table and the column", () => {
    expect(classify(tunnel(300), DATE).table).toBe("Tabela 23 (túnel)");
    expect(
      classify(tank({ m2_installation: "loading_platform" }), DATE).table,
    ).toBe("Tabela 24, coluna plataforma de carregamento");
  });
});

const columnsHolding = (
  columns: { slug: string; when: import("../engine/types").Condition }[],
  facts: Facts,
) =>
  columns
    .filter((c) => evaluateCondition(c.when, facts).outcome === "true")
    .map((c) => c.slug);

describe("Grupo M: columns never overlap", () => {
  it("puts every tunnel length in exactly one column", () => {
    for (const n of [0, 200, 201, 500, 501, 1000, 1001, 5000])
      expect(columnsHolding(TABLE_23_SPEC.columns, tunnel(n))).toHaveLength(1);
  });

  it("puts every M-2 quantity in exactly one column", () => {
    for (const [m2_installation, m2_liquid_m3, m2_gas_quantity] of [
      ["tanks_processes", 20, 10],
      ["tanks_processes", 20.5, 0],
      ["tanks_processes", 0, 10.5],
      ["packaged_products", 20, 12480],
      ["packaged_products", 20, 12481],
      ["loading_platform", 50, 50],
    ] as const)
      expect(
        columnsHolding(
          TABLE_24_SPEC.columns,
          tank({ m2_installation, m2_liquid_m3, m2_gas_quantity }),
        ),
      ).toHaveLength(1);
  });
});

describe("Grupo M-1: tunnels", () => {
  it("splits the columns at 200, 500 and 1.000 m", () => {
    const extinguishers = (n: number) => status(tunnel(n), "extinguishers");
    expect(extinguishers(200)).toBe("not_required");
    expect(extinguishers(201)).toBe("required");
    const hydraulic = (n: number) => status(tunnel(n), "hydraulic_preventive");
    expect(hydraulic(500)).toBe("not_required");
    expect(hydraulic(501)).toBe("required");
    const detection = (n: number) => status(tunnel(n), "automatic_detection");
    expect(detection(1000)).toBe("not_required");
    expect(detection(1001)).toBe("required");
  });

  it("asks for the length and marks the exits as vital", () => {
    expect(
      classify(
        tunnel(0, { tunnel_length_m: undefined }),
        DATE,
      ).nextQuestions.map((q) => q.fact),
    ).toContain("tunnel_length_m");
    expect(
      run(tunnel(100)).systems.find((s) => s.id === "emergency_exits")?.vital,
    ).toBe(true);
  });

  it("does not treat exactly 750 m² or 12 m as a boundary", () => {
    expect(
      run(tunnel(100, { area_m2: 750 })).specificAnalyses.map((a) => a.ruleId),
    ).toEqual([]);
  });
});

describe("Grupo M-2: the five columns", () => {
  it("splits tanks at 20 m³ of liquid or 10 m³ of gas", () => {
    const alarm = (o: Facts) => status(tank(o), "fire_alarm");
    expect(alarm({ m2_liquid_m3: 20 })).toBe("not_required");
    expect(alarm({ m2_liquid_m3: 21 })).toBe("required");
    expect(alarm({ m2_liquid_m3: 0, m2_gas_quantity: 10 })).toBe(
      "not_required",
    );
    expect(alarm({ m2_liquid_m3: 0, m2_gas_quantity: 11 })).toBe("required");
  });

  it("splits packaged products at 12.480 kg of gas", () => {
    const detection = (m2_gas_quantity: number) =>
      status(
        tank({
          m2_installation: "packaged_products",
          m2_liquid_m3: 0,
          m2_gas_quantity,
        }),
        "automatic_detection",
      );
    expect(detection(12480)).toBe("not_required");
    expect(detection(12481)).toBe("required");
  });

  it("reads the platform column without a quantity", () => {
    const f = tank({ m2_installation: "loading_platform", m2_liquid_m3: 5 });
    expect(status(f, "extinguishers")).toBe("required");
    expect(status(f, "emergency_lighting")).toBe("not_required");
  });
});

describe("Grupo M-2: notes", () => {
  it("dispenses vehicle access when the hose reaches within 60 m (note 1)", () => {
    expect(status(tank({ hose_reach_60m: true }), "vehicle_access")).toBe(
      "not_required",
    );
    expect(status(tank({ hose_reach_60m: false }), "vehicle_access")).toBe(
      "required",
    );
  });

  it("requires horizontal compartmentation from 750 m² (note 3)", () => {
    const f = (area_m2: number) =>
      status(tank({ area_m2 }), "horizontal_compartmentation");
    expect(f(749)).toBe("not_required");
    expect(f(750)).toBe("required");
  });

  it("requires vertical compartmentation above 12 m (note 4)", () => {
    const f = (height_m: number) =>
      status(tank({ height_m, storeys: 5 }), "vertical_compartmentation");
    expect(f(12)).toBe("not_required");
    expect(f(12.5)).toBe("required");
  });

  it("requires foam only with liquids (note 6)", () => {
    const f = (m2_liquid_m3: number, m2_gas_quantity: number) =>
      status(tank({ m2_liquid_m3, m2_gas_quantity }), "foam");
    expect(f(30, 0)).toBe("required");
    expect(f(0, 11)).toBe("not_required");
  });
});

describe("Grupo M: scope guards", () => {
  it("still sends several blocks to specific analysis", () => {
    expect(
      run(tank({ single_block: false })).specificAnalyses.map((a) => a.ruleId),
    ).toEqual(["GUARD-multiple-blocks"]);
  });
});
