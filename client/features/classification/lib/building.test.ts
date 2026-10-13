import { describe, expect, it } from "vitest";
import { countAnswers, pickBuildingAnswers } from "./building";

describe("pickBuildingAnswers", () => {
  it("maps snake_case tool output to building answers", () => {
    expect(
      pickBuildingAnswers({
        area_m2: 750,
        height_m: 7.5,
        floor_count: 2,
        occupancy: "commercial",
      }),
    ).toEqual({
      areaM2: 750,
      heightM: 7.5,
      floorCount: 2,
      occupancy: "commercial",
    });
  });

  it("drops an occupancy outside the known list", () => {
    expect(pickBuildingAnswers({ occupancy: "galpão" })).toEqual({});
  });

  it("drops zero, negative and non-numeric measures", () => {
    expect(
      pickBuildingAnswers({ area_m2: 0, height_m: -3, floor_count: "2" }),
    ).toEqual({});
  });

  it("drops a fractional floor count", () => {
    expect(pickBuildingAnswers({ floor_count: 1.5 })).toEqual({});
  });

  it("returns nothing for a non-object output", () => {
    expect(pickBuildingAnswers(null)).toEqual({});
  });
});

describe("countAnswers", () => {
  it("counts the questions that have an answer", () => {
    expect(countAnswers({ areaM2: 1200, occupancy: "commercial" })).toBe(2);
  });

  it("ignores fields set back to undefined", () => {
    expect(countAnswers({ areaM2: undefined, heightM: 8 })).toBe(1);
  });
});
