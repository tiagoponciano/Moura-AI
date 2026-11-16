import { describe, expect, it } from "vitest";
import { adaptationsFor } from "./in5-adaptations";

const kinds = (id: string, cls: "vital" | "indispensable" | "adaptable") =>
  adaptationsFor(id, cls)?.sections.map((s) => s.kind);

describe("adaptationsFor", () => {
  it("gives an adaptable system every section of its table (art. 25)", () => {
    expect(kinds("hydraulic_preventive", "adaptable")).toEqual([
      "adaptations",
      "compensations",
      "exemptions",
      "substitutions",
    ]);
  });

  it("never gives a vital or indispensable system the exemptions or substitutions (arts. 21 and 23)", () => {
    for (const cls of ["vital", "indispensable"] as const) {
      expect(kinds("hydraulic_preventive", cls)).toEqual([
        "adaptations",
        "compensations",
      ]);
    }
  });

  it("drops the sections the annex marks as not applicable", () => {
    expect(kinds("combustible_gas", "adaptable")).toEqual(["adaptations"]);
    expect(kinds("emergency_exits", "adaptable")).toEqual([
      "adaptations",
      "compensations",
    ]);
  });

  it("names the norm and keeps the printed items", () => {
    const hydraulic = adaptationsFor("hydraulic_preventive", "adaptable");
    expect(hydraulic?.norm).toBe("IN 7");
    expect(hydraulic?.sections[0].items).toHaveLength(9);
  });

  it("gives horizontal compartmentation its own adaptations and vertical none", () => {
    const horizontal = adaptationsFor(
      "horizontal_compartmentation",
      "adaptable",
    );
    expect(horizontal?.sections[0].items).toHaveLength(3);
    expect(kinds("vertical_compartmentation", "adaptable")).not.toContain(
      "adaptations",
    );
  });

  it("is nothing for a system the annex has no table for", () => {
    expect(adaptationsFor("sprinklers", "adaptable")).toBeUndefined();
  });
});
