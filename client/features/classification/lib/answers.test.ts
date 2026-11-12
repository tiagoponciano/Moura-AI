import { describe, expect, it } from "vitest";
import { applyAnswers, applyEdit, pickAnswers, pickFacts } from "./answers";

describe("pickAnswers", () => {
  it("keeps valid answers and reads them from `answers` or from the top level", () => {
    const flat = { area_m2: 800, storeys: 2, division: "C-2" };
    expect(pickAnswers(flat).values).toEqual(flat);
    expect(pickAnswers({ answers: flat }).values).toEqual(flat);
  });

  it("drops a value of the wrong type, out of range or not in the options", () => {
    expect(
      pickAnswers({
        area_m2: -5,
        height_m: "8",
        storeys: 2.5,
        division: "D-1",
        single_block: "yes",
        fire_load_class: "huge",
      }).values,
    ).toEqual({});
  });

  it("drops a fact it does not know", () => {
    expect(pickAnswers({ colour: "red" }).values).toEqual({});
  });

  it("accepts não sei only where allowed, and never for a fact that also has a value", () => {
    const picked = pickAnswers({
      unknown: ["fire_load_class", "area_m2", "single_block", "colour"],
      single_block: true,
    });
    expect(picked.unknown).toEqual(["fire_load_class"]);
  });

  it("returns nothing for output that is not an object", () => {
    expect(pickAnswers(null)).toEqual({ values: {}, unknown: [] });
    expect(pickAnswers("area_m2")).toEqual({ values: {}, unknown: [] });
  });
});

describe("applyAnswers", () => {
  it("merges new answers over old ones", () => {
    expect(
      applyAnswers(
        { area_m2: 500, storeys: 1 },
        { values: { area_m2: 900 }, unknown: [] },
      ),
    ).toEqual({ area_m2: 900, storeys: 1 });
  });

  it("records a não sei as null", () => {
    expect(
      applyAnswers({}, { values: {}, unknown: ["fire_load_class"] }),
    ).toEqual({ fire_load_class: null });
  });
});

describe("applyEdit", () => {
  it("sets a valid value typed in the panel", () => {
    expect(applyEdit({}, "area_m2", 640)).toEqual({ area_m2: 640 });
  });

  it("clears the fact when the value is empty or invalid", () => {
    expect(applyEdit({ area_m2: 640 }, "area_m2", undefined)).toEqual({});
    expect(applyEdit({ storeys: 2 }, "storeys", 1.5)).toEqual({});
  });

  it("allows não sei only where it is valid", () => {
    expect(applyEdit({}, "single_use", null)).toEqual({ single_use: null });
    expect(applyEdit({ area_m2: 640 }, "area_m2", null)).toEqual({});
  });

  it("ignores an unknown fact", () => {
    expect(applyEdit({ area_m2: 640 }, "colour", "red")).toEqual({
      area_m2: 640,
    });
  });
});

describe("pickFacts", () => {
  it("validates what the panel sends with a chat message", () => {
    expect(
      pickFacts({
        area_m2: 800,
        storeys: 0,
        single_block: false,
        fire_load_class: null,
        height_m: null,
        colour: "red",
      }),
    ).toEqual({ area_m2: 800, single_block: false, fire_load_class: null });
  });

  it("returns nothing for anything that is not an object", () => {
    expect(pickFacts(undefined)).toEqual({});
    expect(pickFacts([1, 2])).toEqual({});
  });
});
