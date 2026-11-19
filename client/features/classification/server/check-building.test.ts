import { describe, expect, it } from "vitest";
import { checkBuilding } from "./check-building";

const DATE = "2026-11-19";
/** A C-2 shop: the answers the risk rules still need, besides what a person states. */
const shop = {
  division: "C-2",
  area_m2: 820,
  height_m: 9,
  storeys: 3,
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
};

describe("checkBuilding", () => {
  it("settles a C-2 shop of 820 square meters and 9 m as risk III, citing the annex", () => {
    const result = checkBuilding(shop, DATE);
    expect(result.status).toBe("decided");
    expect(result.risk).toBe("III");
    expect(result.source).toContain("Anexo A");
  });

  it("says what is missing instead of guessing the risk", () => {
    const result = checkBuilding({ division: "C-2" }, DATE);
    expect(result.status).toBe("pending");
    expect(result.risk).toBeUndefined();
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("is not covered for a division without rules, with no risk invented", () => {
    const result = checkBuilding({ division: "L-1", area_m2: 100 }, DATE);
    expect(result.status).toBe("not_covered");
    expect(result.risk).toBeUndefined();
  });

  it("does not report a conflict when nothing was declared", () => {
    expect(checkBuilding(shop, DATE).conflicts).toEqual([]);
  });

  it("flags a declared risk that differs from the norm, once the risk is settled", () => {
    const base = checkBuilding(shop, DATE);
    expect(base.status).toBe("decided");
    const wrong = base.risk === "II" ? "IV" : "II";
    const result = checkBuilding(
      { ...shop, declared_risk: wrong as "II" },
      DATE,
    );
    expect(result.conflicts.join(" ")).toContain(
      `pela norma o risco é ${base.risk}`,
    );
  });

  it("agrees with a declared risk that matches the norm", () => {
    const base = checkBuilding(shop, DATE);
    expect(base.status).toBe("decided");
    const result = checkBuilding(
      { ...shop, declared_risk: base.risk as "III" },
      DATE,
    );
    expect(result.conflicts).toEqual([]);
  });
});
