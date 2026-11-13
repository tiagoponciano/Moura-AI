import { describe, expect, it } from "vitest";
import { evaluateRules } from "../engine/evaluate-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";
import { GROUP_C_RULES } from "./group-c";

const DATE = "2026-11-12";

/** A C-2 shop with no special risks, no exemption and a medium fire load. */
const shop = (overrides: Facts = {}): Facts => ({
  division: "C-2",
  area_m2: 700,
  storeys: 2,
  height_m: 8,
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  ...overrides,
});

const risk = (facts: Facts) => {
  const outcome = evaluateRules(GROUP_C_RULES, facts, DATE).risk;
  return outcome.status === "decided" ? outcome.level : outcome.status;
};

describe("risk: Risco II (Quadro 1)", () => {
  it.each([
    [{ area_m2: 750 }, "II"],
    [{ area_m2: 750.01 }, "III"],
    [{ storeys: 3, height_m: 9 }, "II"],
    [{ storeys: 4, height_m: 11 }, "III"],
  ])("area and storeys %j → %s", (overrides, level) => {
    expect(risk(shop(overrides))).toBe(level);
  });

  it("allows 190 kg of LPG and 250 L inside and 20 m³ outside, and no more", () => {
    const special = { special_risks: true, hazardous_substances: false };
    const at = {
      glp_kg: 190,
      flammable_internal_l: 250,
      flammable_external_m3: 20,
    };
    expect(risk(shop({ ...special, ...at }))).toBe("II");
    for (const over of [
      { glp_kg: 190.01 },
      { flammable_internal_l: 250.01 },
      { flammable_external_m3: 20.01 },
    ]) {
      expect(risk(shop({ ...special, ...at, ...over }))).toBe("III");
    }
  });
});

describe("risk: Risco III (Quadro 2), for each commercial row", () => {
  const big = { area_m2: 1000 };

  it.each([
    [
      "C-1 up to 21 m and 5.000 m²",
      { division: "C-1", height_m: 21, area_m2: 5000, storeys: 7 },
      "III",
    ],
    [
      "C-1 above 21 m",
      { division: "C-1", height_m: 21.01, area_m2: 5000, storeys: 7 },
      "IV",
    ],
    [
      "C-1 above 5.000 m²",
      { division: "C-1", height_m: 8, area_m2: 5000.01 },
      "IV",
    ],
    [
      "C-2 medium up to 12 m and 5.000 m²",
      { height_m: 12, area_m2: 5000, storeys: 4 },
      "III",
    ],
    [
      "C-2 medium above 12 m",
      { height_m: 12.01, area_m2: 5000, storeys: 4 },
      "IV",
    ],
    ["C-2 medium above 5.000 m²", { area_m2: 5000.01 }, "IV"],
    [
      "C-2 high up to 3.000 m²",
      { fire_load_class: "high", area_m2: 3000 },
      "III",
    ],
    [
      "C-2 high above 3.000 m²",
      { fire_load_class: "high", area_m2: 3000.01 },
      "IV",
    ],
    [
      "C-3 up to 6 m and 5.000 m²",
      { division: "C-3", height_m: 6, area_m2: 5000, storeys: 2 },
      "III",
    ],
    [
      "C-3 from 6 to 12 m up to 3.000 m²",
      { division: "C-3", height_m: 12, area_m2: 3000, storeys: 3 },
      "III",
    ],
    [
      "C-3 from 6 to 12 m above 3.000 m²",
      { division: "C-3", height_m: 12, area_m2: 3000.01, storeys: 3 },
      "IV",
    ],
    [
      "C-3 above 12 m",
      { division: "C-3", height_m: 12.01, area_m2: 1000, storeys: 3 },
      "IV",
    ],
  ])("%s", (_name, overrides, level) => {
    expect(risk(shop({ ...big, ...overrides }))).toBe(level);
  });

  it("treats a single-storey building as height 0", () => {
    expect(
      risk(shop({ division: "C-3", storeys: 1, height_m: 14, area_m2: 3000 })),
    ).toBe("III");
  });

  it("reads a C-2 whose load is neither medium nor high as no III row, so IV (see the review sheet)", () => {
    expect(risk(shop({ ...big, fire_load_class: "low" }))).toBe("IV");
  });
});

describe("risk: Risco V and the cascade", () => {
  it("is V above 2.280 MJ/m² whatever the size", () => {
    expect(risk(shop({ fire_load_class: "very_high" }))).toBe("V");
  });

  it("is V for dangerous substances, and for liquids above 1.000 L inside or 40 m³ outside", () => {
    const special = {
      special_risks: true,
      hazardous_substances: false,
      glp_kg: 0,
    };
    expect(
      risk(shop({ special_risks: true, hazardous_substances: true })),
    ).toBe("V");
    expect(
      risk(
        shop({
          ...special,
          flammable_internal_l: 1000,
          flammable_external_m3: 0,
        }),
      ),
    ).not.toBe("V");
    expect(
      risk(
        shop({
          ...special,
          flammable_internal_l: 1000.01,
          flammable_external_m3: 0,
        }),
      ),
    ).toBe("V");
    expect(
      risk(
        shop({
          ...special,
          flammable_internal_l: 0,
          flammable_external_m3: 40,
        }),
      ),
    ).not.toBe("V");
    expect(
      risk(
        shop({
          ...special,
          flammable_internal_l: 0,
          flammable_external_m3: 40.01,
        }),
      ),
    ).toBe("V");
  });

  it("puts V before everything else, I included", () => {
    expect(
      risk(shop({ fire_load_class: "very_high", risk_exempt: true })),
    ).toBe("V");
  });

  it("is I for an exempt activity that is not V", () => {
    expect(risk(shop({ risk_exempt: true, area_m2: 9000 }))).toBe("I");
  });

  it("is IV when nothing before holds", () => {
    expect(risk(shop({ area_m2: 9000 }))).toBe("IV");
  });
});

describe("risk: what it asks and what it does not decide", () => {
  const outcome = (facts: Facts) =>
    evaluateRules(GROUP_C_RULES, facts, DATE).risk;

  it("stops at the fire load, which V needs, even for a small shop", () => {
    expect(outcome(shop({ fire_load_class: undefined }))).toEqual({
      status: "pending",
      blockedBy: "IN1P1-RISK-V",
      missing: ["fire_load_class"],
    });
  });

  it("does not let II or III decide while V cannot be ruled out", () => {
    expect(risk(shop({ special_risks: undefined }))).toBe("pending");
    expect(risk(shop({ special_risks: null }))).toBe("pending");
  });

  it("does not ask for the amounts unless there is something special", () => {
    const result = evaluateRules(GROUP_C_RULES, shop(), DATE);
    expect(result.unanswered).not.toContain("glp_kg");
    expect(result.unanswered).not.toContain("flammable_internal_l");
  });

  it("does not classify a division outside the group", () => {
    expect(risk(shop({ division: "K-1" }))).toBe("no_rule");
  });

  it("quotes the norm for the level it decided", () => {
    const result = evaluateRules(GROUP_C_RULES, shop(), DATE);
    expect(result.risk).toMatchObject({
      status: "decided",
      level: "II",
      ruleId: "IN1P1-RISK-II",
    });
    const rule = GROUP_C_RULES.find((r) => r.id === "IN1P1-RISK-II")!;
    expect(rule.source).toMatchObject({
      doc: "IN-1-P1",
      locator: "Anexo A, Quadro 1",
    });
    expect(rule.validFrom).toBe("2024-04-24");
  });
});

describe("risk: the order of the rules of every group", () => {
  const riskRules = ALL_RULES.filter((r) => r.stage === "risk");
  const iv = riskRules.find((r) => r.id === "IN1P1-RISK-IV")!;

  it("has every rule that decides a level before the risk IV rule, which takes what is left", () => {
    for (const rule of riskRules) {
      if (rule === iv) continue;
      expect(rule.priority, rule.id).toBeLessThan(iv.priority);
    }
  });

  it("has V, I and II before the rows of Quadro 2", () => {
    const order = (id: string) => riskRules.find((r) => r.id === id)!.priority;
    for (const rule of riskRules.filter((r) =>
      r.id.startsWith("IN1P1-RISK-III-"),
    )) {
      expect(rule.priority, rule.id).toBeGreaterThan(order("IN1P1-RISK-II"));
    }
    expect(order("IN1P1-RISK-V")).toBeLessThan(order("IN1P1-RISK-I"));
    expect(order("IN1P1-RISK-I")).toBeLessThan(order("IN1P1-RISK-II"));
  });
});
