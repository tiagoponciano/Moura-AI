import { describe, expect, it } from "vitest";
import { classify } from "../classify";
import { lintRules } from "../engine/lint-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { IN5_RULES } from "./in5";

const DATE = "2026-11-12";

const shop = (o: Facts = {}): Facts => ({
  division: "C-2",
  area_m2: 1800,
  storeys: 2,
  height_m: 9,
  fire_load_class: "medium",
  single_block: true,
  single_use: true,
  storage_over_3_5m: false,
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  building_condition: "existing",
  ...o,
});
const treatment = (f: Facts, id: string) =>
  [
    ...classify(f, DATE).groups.required,
    ...classify(f, DATE).groups.needsInfo,
  ].find((s) => s.id === id)?.treatment;

describe("IN 5 overlay rules", () => {
  it("are well formed", () => {
    expect(lintRules(ALL_RULES)).toEqual([]);
    expect(IN5_RULES.length).toBeGreaterThan(100);
  });

  it("labels the systems of an existing C-2 building as Annex B says", () => {
    expect(treatment(shop(), "extinguishers")).toBe("vital");
    expect(treatment(shop(), "emergency_signage")).toBe("vital");
    expect(treatment(shop(), "fire_alarm")).toBe("indispensable");
    expect(treatment(shop(), "hydraulic_preventive")).toBe("adaptable");
  });

  it("labels nothing for a new building or when the condition is not given", () => {
    expect(
      treatment(shop({ building_condition: "new" }), "extinguishers"),
    ).toBeUndefined();
    expect(
      treatment(shop({ building_condition: undefined }), "extinguishers"),
    ).toBeUndefined();
  });

  it("does not ask the condition: the answer is only taken when the user volunteers it", () => {
    expect(
      classify(shop({ building_condition: undefined }), DATE).nextQuestions.map(
        (q) => q.fact,
      ),
    ).not.toContain("building_condition");
  });

  it("reads each division by its own row", () => {
    // Annex B: C-2 has compartmentation among the indispensables; C-1 does not.
    const c1 = shop({ division: "C-1", area_m2: 1800 });
    expect(treatment(c1, "horizontal_compartmentation")).toBe("adaptable");
    expect(treatment(shop(), "horizontal_compartmentation")).toBe(
      "indispensable",
    );
  });

  it("applies a conditional cell only while its note holds (K-2, hydraulic system only when thermal)", () => {
    const plant = (power_plant_type: string) =>
      shop({
        division: "K-2",
        power_plant_type,
        storeys: 1,
        height_m: 0,
        fire_load_class: "high",
      });
    expect(treatment(plant("thermal"), "hydraulic_preventive")).toBe(
      "indispensable",
    );
    expect(treatment(plant("hydro"), "hydraulic_preventive")).toBe("adaptable");
  });
});
