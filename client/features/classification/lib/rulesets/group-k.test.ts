import { describe, expect, it } from "vitest";
import table22Json from "../../norms/in-1-p2/tables/table-22.json";
import { classify } from "../classify";
import { evaluateRules } from "../engine/evaluate-rules";
import { lintRules } from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { TABLE_22_SPEC } from "./group-k";
import type { ExtractedTable } from "./types";

const DATE = "2026-11-12";
const table22 = table22Json as unknown as ExtractedTable;

const plant = (overrides: Facts = {}): Facts => ({
  division: "K-2",
  power_plant_type: "hydro",
  area_m2: 3000,
  storeys: 2,
  height_m: 10,
  fire_load_class: "low",
  single_block: true,
  single_use: true,
  special_risks: false,
  risk_exempt: false,
  public_road_within_50m: false,
  solid_fuel_storage_m2: 0,
  combustible_liquid_storage: false,
  ...overrides,
});
const substation = (overrides: Facts = {}): Facts =>
  plant({
    division: "K-1",
    power_plant_type: undefined,
    combustible_liquid_m3: 10,
    ...overrides,
  });
const run = (f: Facts) => evaluateRules(ALL_RULES, f, DATE);
const status = (f: Facts, id: string) =>
  run(f).systems.find((s) => s.id === id)?.status;

describe("Grupo K rules", () => {
  it("are well formed", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
  });

  it("encode every note the cells cite", () => {
    const cited = [
      ...new Set(
        table22.rows.flatMap((r) =>
          r.cells.flatMap((c) => (c.mark === "x" ? c.refs : [])),
        ),
      ),
    ].sort((a, b) => a - b);
    expect(TABLE_22_SPEC.notes.map((n) => n.number)).toEqual(
      expect.arrayContaining(cited),
    );
  });

  it("names Tabela 22 and the column", () => {
    expect(
      classify(substation({ combustible_liquid_m3: 30 }), DATE).table,
    ).toBe("Tabela 22, coluna K-1, > 20 m³");
    expect(classify(plant({ power_plant_type: "thermal" }), DATE).table).toBe(
      "Tabela 22, coluna K-2, termoelétrica",
    );
  });
});

describe("Grupo K: columns", () => {
  it("splits K-1 at 20 m³ of combustible liquid", () => {
    expect(status(substation({ combustible_liquid_m3: 20 }), "foam")).toBe(
      "not_required",
    );
    expect(status(substation({ combustible_liquid_m3: 20.1 }), "foam")).toBe(
      "required",
    );
    expect(status(substation({ combustible_liquid_m3: 20.1 }), "cooling")).toBe(
      "required",
    );
    expect(status(substation({ combustible_liquid_m3: 20 }), "cooling")).toBe(
      "not_required",
    );
  });

  it("splits K-2 by plant type", () => {
    expect(
      status(plant({ power_plant_type: "hydro" }), "automatic_detection"),
    ).toBe("required");
    expect(status(plant({ power_plant_type: "thermal" }), "sprinklers")).toBe(
      "not_required",
    );
    expect(
      status(
        plant({ power_plant_type: "thermal", height_m: 60, storeys: 20 }),
        "sprinklers",
      ),
    ).toBe("required");
  });

  it("asks for the liquid volume and the plant type before deciding", () => {
    const k1 = run(substation({ combustible_liquid_m3: undefined }));
    expect(k1.systems.find((s) => s.id === "extinguishers")?.status).toBe(
      "needs_info",
    );
    expect(
      classify(
        substation({ combustible_liquid_m3: undefined }),
        DATE,
      ).nextQuestions.map((q) => q.fact),
    ).toContain("combustible_liquid_m3");
    expect(
      classify(plant({ power_plant_type: undefined }), DATE).nextQuestions.map(
        (q) => q.fact,
      ),
    ).toContain("power_plant_type");
  });
});

describe("Grupo K: notes", () => {
  it("requires the emergency elevator from 40 m (note 6)", () => {
    expect(status(plant({ height_m: 39.9 }), "emergency_elevator")).toBe(
      "not_required",
    );
    expect(
      status(plant({ height_m: 40, storeys: 14 }), "emergency_elevator"),
    ).toBe("required");
  });

  it("dispenses vehicle access within 50 m of the sidewalk (note 1)", () => {
    expect(
      status(substation({ public_road_within_50m: true }), "vehicle_access"),
    ).toBe("not_required");
    expect(
      status(substation({ public_road_within_50m: false }), "vehicle_access"),
    ).toBe("required");
  });

  it("requires the alarm only above 750 m² of solid fuel (note 2)", () => {
    expect(status(plant({ solid_fuel_storage_m2: 750 }), "fire_alarm")).toBe(
      "not_required",
    );
    expect(status(plant({ solid_fuel_storage_m2: 751 }), "fire_alarm")).toBe(
      "required",
    );
  });

  it("requires structural protection only with liquid storage (note 7)", () => {
    expect(
      status(
        plant({ combustible_liquid_storage: false }),
        "structural_protection",
      ),
    ).toBe("not_required");
    expect(
      status(
        plant({ combustible_liquid_storage: true }),
        "structural_protection",
      ),
    ).toBe("required");
  });

  it("offers the NBR 13231 system as a substitute for foam in K-1 (note 8)", () => {
    const foam = run(substation({ combustible_liquid_m3: 30 })).systems.find(
      (s) => s.id === "foam",
    );
    expect(foam?.substitutions[0]?.by[0]).toContain("NBR 13231");
  });

  it("requires vertical compartmentation for a high fire load (note 10)", () => {
    expect(
      status(plant({ fire_load_class: "medium" }), "vertical_compartmentation"),
    ).toBe("not_required");
    expect(
      status(plant({ fire_load_class: "high" }), "vertical_compartmentation"),
    ).toBe("required");
  });
});

describe("Grupo K: scope guards", () => {
  const analyses = (f: Facts) => run(f).specificAnalyses.map((a) => a.ruleId);

  it("does not treat exactly 750 m² or 12 m as a boundary", () => {
    expect(analyses(plant({ area_m2: 750, height_m: 8 }))).toEqual([]);
    expect(analyses(plant({ area_m2: 500, height_m: 12, storeys: 3 }))).toEqual(
      [],
    );
  });

  it("still sends several blocks and mixed use to specific analysis", () => {
    expect(analyses(plant({ single_block: false }))).toEqual([
      "GUARD-multiple-blocks",
    ]);
    expect(
      analyses(plant({ single_use: false, only_subsidiary: false })),
    ).toEqual(["GUARD-mixed-use"]);
  });
});
