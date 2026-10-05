import { describe, expect, it } from "vitest";
import { evaluateBuilding, evaluateRule } from "./evaluate";
import type { SystemRule } from "./rules";

const rule = (when: SystemRule["when"]): SystemRule => ({
  id: "test",
  system: "Sistema de teste",
  checks: ["Verificar algo"],
  when,
});

describe("evaluateRule", () => {
  it("requires a rule without conditions for any building", () => {
    const result = evaluateRule(rule([]), {});
    expect(result).toMatchObject({
      status: "required",
      reason: "vale para todas as edificações",
    });
  });

  it("requires when a threshold is exceeded", () => {
    const result = evaluateRule(rule([{ minAreaM2: 750 }]), { areaM2: 751 });
    expect(result).toMatchObject({
      status: "required",
      reason: "área acima de 750 m²",
    });
  });

  it("treats thresholds as exclusive", () => {
    const result = evaluateRule(rule([{ minAreaM2: 750 }]), { areaM2: 750 });
    expect(result.status).toBe("not_required");
  });

  it("asks for the answer a condition depends on", () => {
    const result = evaluateRule(rule([{ minHeightM: 12 }]), { areaM2: 100 });
    expect(result).toMatchObject({
      status: "needs_info",
      missing: ["heightM"],
    });
  });

  it("requires when any one condition holds, even if others are unknown", () => {
    const result = evaluateRule(
      rule([{ minHeightM: 12 }, { minAreaM2: 750 }]),
      {
        areaM2: 1000,
      },
    );
    expect(result.status).toBe("required");
  });

  it("needs every criterion of a condition to hold", () => {
    const result = evaluateRule(
      rule([{ occupancies: ["health"], minAreaM2: 750 }]),
      { occupancy: "health", areaM2: 500 },
    );
    expect(result.status).toBe("not_required");
  });

  it("does not ask for answers of a condition already ruled out", () => {
    const result = evaluateRule(
      rule([{ occupancies: ["health"], minAreaM2: 750 }]),
      { occupancy: "commercial" },
    );
    expect(result).toMatchObject({ status: "not_required", missing: [] });
  });

  it("lists missing answers from every open condition once", () => {
    const result = evaluateRule(
      rule([{ minAreaM2: 750 }, { occupancies: ["health"], minAreaM2: 300 }]),
      {},
    );
    expect(result.missing).toEqual(["areaM2", "occupancy"]);
  });

  it("explains a combined condition with all its criteria", () => {
    const result = evaluateRule(
      rule([{ occupancies: ["health", "education"], minAreaM2: 750 }]),
      { occupancy: "education", areaM2: 1000 },
    );
    expect(result.reason).toBe(
      "área acima de 750 m² e ocupação saúde, educacional",
    );
  });

  it("formats thresholds in Brazilian notation", () => {
    const result = evaluateRule(rule([{ minAreaM2: 1500 }]), { areaM2: 2000 });
    expect(result.reason).toBe("área acima de 1.500 m²");
  });

  it("counts floors as more than the threshold", () => {
    const result = evaluateRule(rule([{ minFloorCount: 2 }]), {
      floorCount: 3,
    });
    expect(result.reason).toBe("mais de 2 pavimentos");
  });
});

describe("evaluateBuilding", () => {
  it("returns one requirement per rule, in rule order", () => {
    const rules = [
      { ...rule([]), id: "a" },
      { ...rule([{ minAreaM2: 10 }]), id: "b" },
    ];
    expect(evaluateBuilding(rules, {}).map((r) => r.id)).toEqual(["a", "b"]);
  });
});
