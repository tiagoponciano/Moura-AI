import { describe, expect, it } from "vitest";
import { classify } from "../classify";

const DATE = "2026-11-19";
const answers = (division: string) => ({
  division,
  area_m2: 400,
  storeys: 1,
  height_m: 4,
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  single_block: true,
  single_use: true,
});

describe("M-8, M-9 and M-10", () => {
  it.each(["M-8", "M-9", "M-10"])(
    "%s says the norm has no table for it, instead of calling it not yet covered",
    (division) => {
      const result = classify(answers(division), DATE);
      expect(result.status).toBe("analysis");
      expect(result.analyses[0].reason).toContain("nenhuma de suas tabelas");
      expect(result.analyses[0].reason).not.toContain("ainda não está coberta");
      expect(result.groups.required).toEqual([]);
    },
  );

  it("keeps the general message for a division that only lacks rules", () => {
    const result = classify(answers("L-1"), DATE);
    expect(result.analyses[0].reason).toContain("ainda não está coberta");
  });
});
