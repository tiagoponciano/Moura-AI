import { describe, expect, it } from "vitest";
import {
  parseScale,
  parseWarnings,
  scaleReading,
} from "./floor-plan-conversion";

describe("parseScale", () => {
  it("reads 1:100 as 100", () => {
    expect(parseScale("1:100")).toBe(100);
  });

  it("accepts spaces and a slash", () => {
    expect(parseScale(" 1 / 50 ")).toBe(50);
  });

  it("accepts the bare denominator", () => {
    expect(parseScale("75")).toBe(75);
  });

  it("refuses text, a ratio that does not start at 1 and zero", () => {
    expect(parseScale("cem")).toBeUndefined();
    expect(parseScale("2:100")).toBeUndefined();
    expect(parseScale("0")).toBeUndefined();
  });

  it("refuses a denominator over 5000", () => {
    expect(parseScale("5001")).toBeUndefined();
  });
});

describe("parseWarnings", () => {
  it("names each code in Portuguese", () => {
    expect(parseWarnings("blurry,low_contrast")).toEqual([
      "A imagem está borrada; o resultado pode ser pouco confiável.",
      "O contraste é baixo; linhas fracas podem ter ficado de fora.",
    ]);
  });

  it("returns nothing for an empty or missing header", () => {
    expect(parseWarnings("")).toEqual([]);
    expect(parseWarnings(null)).toEqual([]);
  });

  it("keeps an unknown code as it came", () => {
    expect(parseWarnings("new_problem")).toEqual(["new_problem"]);
  });
});

describe("scaleReading", () => {
  it("accepts a whole scale with its evidence", () => {
    expect(
      scaleReading.safeParse({ scale: 100, evidence: "ESC 1:100" }).success,
    ).toBe(true);
  });

  it("accepts null when the scale is not written", () => {
    expect(scaleReading.safeParse({ scale: null, evidence: "" }).success).toBe(
      true,
    );
  });

  it("refuses a scale the service would refuse", () => {
    expect(scaleReading.safeParse({ scale: 0, evidence: "" }).success).toBe(
      false,
    );
    expect(scaleReading.safeParse({ scale: 12.5, evidence: "" }).success).toBe(
      false,
    );
  });
});
