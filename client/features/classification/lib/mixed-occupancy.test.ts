import { describe, expect, it } from "vitest";
import { evaluateRules } from "./engine/evaluate-rules";
import type { Facts, Rule } from "./engine/types";
import {
  classifyMixed,
  type MixedInput,
  type OccupationPart,
} from "./mixed-occupancy";
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
  area_m2: 500,
  top_height_m: 8,
  storeys: 3,
  separation: "open",
  ...o,
});
const mixed = (parts: OccupationPart[], kind: MixedInput["kind"] = "mixed") =>
  classifyMixed({ kind, base, parts }, DATE);
const system = (r: ReturnType<typeof mixed>, id: string) =>
  r.systems.find((s) => s.id === id);

/** Two systems that read the area, so the sum of areas and the autonomy show. */
const rule = (id: string, system: string, op: "gt", value: number): Rule => ({
  id,
  name: id,
  version: "1",
  validFrom: "2024-04-24",
  stage: "systems",
  priority: 10,
  when: { fact: "area_m2", op, value },
  then: { require: system },
  source: { doc: "TEST", locator: id },
  status: "provisional",
});
const forDivision = (id: string, system: string, division: string): Rule => ({
  ...rule(id, system, "gt", 0),
  when: { fact: "division", op: "eq", value: division },
});
const stub = [
  forDivision("t-hydraulic-c2", "hydraulic_preventive", "C-2"),
  rule("t-alarm", "fire_alarm", "gt", 1000),
  rule("t-smoke", "smoke_control", "gt", 1000),
  rule("t-elevator", "emergency_elevator", "gt", 1000),
  rule("t-sprinklers", "sprinklers", "gt", 1000),
];
const run = (parts: OccupationPart[], kind: MixedInput["kind"] = "mixed") =>
  classifyMixed({ kind, base, parts }, DATE, stub);

describe("classifyMixed: art. 11, areas that are not isolated", () => {
  it("adds the areas of the parts before applying each table", () => {
    const result = run([
      part({ division: "C-2", area_m2: 600 }),
      part({ division: "A-2", area_m2: 600 }),
    ]);
    expect(result.parts.map((p) => p.facts.area_m2)).toEqual([1200, 1200]);
    expect(system(result, "fire_alarm")?.status).toBe("required");
  });

  it("uses the height of the building for every part when none is compartmented (art. 11, II)", () => {
    const result = mixed([
      part({ division: "C-2", area_m2: 800, top_height_m: 8 }),
      part({ division: "A-2", area_m2: 1200, top_height_m: 32, storeys: 11 }),
    ]);
    expect(result.parts.map((p) => p.facts.height_m)).toEqual([32, 32]);
  });

  it("uses the height of each part when they are compartmented (art. 11, III)", () => {
    const result = mixed([
      part({
        division: "C-2",
        area_m2: 800,
        top_height_m: 8,
        separation: "compartmented",
      }),
      part({
        division: "A-2",
        area_m2: 1200,
        top_height_m: 32,
        storeys: 11,
        separation: "compartmented",
      }),
    ]);
    expect(result.parts.map((p) => p.facts.height_m)).toEqual([8, 32]);
  });

  it("joins the systems of the parts: what any table requires is required", () => {
    const parts = [
      part({ division: "C-2", area_m2: 800, top_height_m: 8 }),
      part({ division: "A-2", area_m2: 1200, top_height_m: 32, storeys: 11 }),
    ];
    const result = mixed(parts);
    const alone = (division: string, storeys: number) =>
      evaluateRules(
        ALL_RULES,
        {
          ...base,
          division,
          area_m2: 2000,
          height_m: 32,
          storeys,
          single_block: true,
          single_use: true,
        },
        DATE,
      )
        .systems.filter((s) => s.status === "required")
        .map((s) => s.id);
    for (const id of [...alone("C-2", 3), ...alone("A-2", 11)])
      expect(system(result, id)?.status).toBe("required");
  });
});

describe("classifyMixed: reductions of art. 11, III", () => {
  const compartmented = (storeys: number) => [
    part({
      division: "C-2",
      area_m2: 600,
      storeys,
      separation: "compartmented",
    }),
    part({
      division: "A-2",
      area_m2: 600,
      storeys,
      top_height_m: 20,
      separation: "compartmented",
    }),
  ];

  it("sizes smoke control by the part itself on a single storey, but not the alarm", () => {
    const result = run(compartmented(1));
    expect(system(result, "fire_alarm")?.status).toBe("required");
    expect(system(result, "smoke_control")?.status).toBe("not_required");
  });

  it("sizes the emergency elevator by the part itself below 21 m, on more storeys", () => {
    const result = run(compartmented(5));
    expect(system(result, "emergency_elevator")?.status).toBe("not_required");
    expect(system(result, "fire_alarm")?.status).toBe("required");
  });

  it("does not size the elevator by the part itself from 21 m", () => {
    const tall = compartmented(5).map((p) => ({ ...p, top_height_m: 25 }));
    expect(system(run(tall), "emergency_elevator")?.status).toBe("required");
  });

  it("sizes sprinklers by the part itself on a single storey and for residential areas", () => {
    expect(system(run(compartmented(1)), "sprinklers")?.status).toBe(
      "not_required",
    );
    // On more storeys only the residential part sizes them by itself: the commercial part keeps the summed area.
    const result = run(compartmented(5));
    expect(system(result, "sprinklers")).toMatchObject({
      status: "required",
      from: ["C-2"],
    });
  });

  it("keeps the summed area when the parts are only open", () => {
    const open = compartmented(1).map((p) => ({
      ...p,
      separation: "open" as const,
    }));
    expect(system(run(open), "smoke_control")?.status).toBe("required");
  });
});

describe("classifyMixed: isolated parts", () => {
  it("treats an isolated part on its own area and height (art. 11, I)", () => {
    const result = run([
      part({ division: "C-2", area_m2: 900, separation: "isolated" }),
      part({ division: "A-2", area_m2: 900 }),
    ]);
    expect(result.parts.map((p) => p.facts.area_m2)).toEqual([900, 900]);
    expect(system(result, "fire_alarm")).toMatchObject({
      status: "not_required",
    });
  });
});

describe("classifyMixed: art. 12, secondary occupations", () => {
  it("adds the secondary tables only in the secondary area", () => {
    const result = run(
      [
        part({ division: "A-2", area_m2: 500 }),
        part({ division: "C-2", area_m2: 1500 }),
      ],
      "secondary",
    );
    expect(system(result, "hydraulic_preventive")).toMatchObject({
      status: "required",
      from: ["C-2"],
      scopes: ["somente na área da ocupação secundária C-2"],
    });
  });

  it("keeps a requirement of the predominant occupation for the whole building", () => {
    const result = run(
      [
        part({ division: "A-2", area_m2: 1500 }),
        part({ division: "C-2", area_m2: 1500 }),
      ],
      "secondary",
    );
    expect(system(result, "fire_alarm")?.scopes).toEqual([]);
  });
});

describe("classifyMixed: notes and errors", () => {
  it("always reminds about the garage and, with vertical compartmentation, about the lower floors", () => {
    const result = mixed([
      part({ division: "C-2", area_m2: 800, top_height_m: 8 }),
      part({ division: "A-2", area_m2: 1200, top_height_m: 32, storeys: 11 }),
    ]);
    expect(result.notes.some((n) => n.startsWith("Garagem"))).toBe(true);
    expect(
      result.notes.some((n) => n.startsWith("Compartimentação vertical")),
    ).toBe(true);
  });

  it("refuses an empty list of parts", () => {
    expect(() => mixed([])).toThrow("parts must not be empty");
  });
});
