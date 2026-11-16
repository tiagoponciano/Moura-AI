import { describe, expect, it } from "vitest";
import type { Facts } from "./engine/types";
import {
  classifyMixed,
  type MixedKind,
  type OccupationPart,
} from "./mixed-occupancy";
import { classifyMixedBuilding } from "./mixed-classification";
import { ALL_RULES } from "./rulesets/all-rules";

const DATE = "2026-11-12";
const base: Facts = {
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  storage_over_3_5m: false,
};
const part = (
  o: Partial<OccupationPart> & { division: string },
): OccupationPart => ({
  area_m2: 2000,
  top_height_m: 20,
  storeys: 6,
  separation: "open",
  ...o,
});
const building = (
  parts: OccupationPart[],
  b: Facts = base,
  kind: MixedKind = "mixed",
) => classifyMixedBuilding({ kind, base: b, parts }, DATE);
const everySystem = (c: ReturnType<typeof building>) => [
  ...c.groups.required,
  ...c.groups.needsInfo,
  ...c.groups.notRequired,
];

describe("classifyMixedBuilding", () => {
  const parts = [part({ division: "C-2" }), part({ division: "D-1" })];

  it("lists every system classifyMixed decided, with the same status", () => {
    const joined = classifyMixed({ kind: "mixed", base, parts }, DATE);
    const shown = everySystem(building(parts));
    expect(shown.map((s) => [s.id, s.status]).sort()).toEqual(
      joined.systems.map((s) => [s.id, s.status]).sort(),
    );
  });

  it("gives a required system the rules that required it", () => {
    const required = building(parts).groups.required;
    expect(required.length).toBeGreaterThan(0);
    for (const system of required)
      expect(system.reasons.length).toBeGreaterThan(0);
  });

  it("limits a system to the secondary occupation's area when the building has a predominant one", () => {
    const c = building(
      [
        part({ division: "A-2", area_m2: 500, top_height_m: 8, storeys: 3 }),
        part({ division: "C-2", area_m2: 1500, top_height_m: 8, storeys: 3 }),
      ],
      base,
      "secondary",
    );
    const secondary = c.groups.required.filter((s) =>
      s.scopes.some((scope) => scope.includes("ocupação secundária C-2")),
    );
    expect(secondary.length).toBeGreaterThan(0);
    for (const system of secondary) expect(system.partial).toBe(true);
  });

  it("asks for what the rules still need, and never for what the parts carry", () => {
    const { fire_load_class: _omit, ...without } = base;
    void _omit;
    const c = building(parts, without);
    expect(c.status).toBe("pending");
    const asked = c.nextQuestions.map((q) => q.fact);
    expect(asked).toContain("fire_load_class");
    for (const fact of ["division", "area_m2", "height_m", "storeys"]) {
      expect(asked).not.toContain(fact);
    }
  });

  it("replaces the list by the specific analysis when a part ends in one", () => {
    const c = building([part({ division: "C-2" }), part({ division: "M-8" })]);
    expect(c.status).toBe("analysis");
    expect(c.analyses.length).toBeGreaterThan(0);
    expect(everySystem(c)).toEqual([]);
  });

  it("repeats the garage rule and stays provisional", () => {
    const c = building(parts);
    expect(c.observations.some((o) => o.text.includes("Garagem"))).toBe(true);
    expect(c.provisional).toBe(true);
  });

  it("uses the rules it is given", () => {
    const c = classifyMixedBuilding({ kind: "mixed", base, parts }, DATE, []);
    expect(c.groups.required).toEqual([]);
    expect(ALL_RULES.length).toBeGreaterThan(0);
  });
});
