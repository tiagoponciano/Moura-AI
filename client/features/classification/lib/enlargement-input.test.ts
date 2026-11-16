import { describe, expect, it } from "vitest";
import {
  divisionOf,
  enlargementFor,
  pickEnlargement,
} from "./enlargement-input";

const answers = {
  originalAreaM2: 700,
  addedAreaM2: 105,
  originalRegularized: true,
  compartmented: true,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: false,
};

describe("pickEnlargement", () => {
  it("keeps a valid enlargement", () => {
    expect(pickEnlargement(answers)).toEqual(answers);
  });

  it("drops one with a missing or invalid field", () => {
    expect(pickEnlargement({ ...answers, addedAreaM2: -1 })).toBeUndefined();
    expect(
      pickEnlargement({ ...answers, compartmented: "yes" }),
    ).toBeUndefined();
    expect(pickEnlargement(null)).toBeUndefined();
  });
});

describe("divisionOf", () => {
  it("reads the division that was answered", () => {
    expect(divisionOf({ division: "A-2" })).toBe("A-2");
  });

  it("falls back to the division of the chosen activity", () => {
    expect(divisionOf({ activity: "nope" })).toBeUndefined();
    expect(divisionOf({})).toBeUndefined();
  });
});

describe("enlargementFor", () => {
  it("is nothing without an enlargement or without a division", () => {
    expect(enlargementFor({ division: "A-2" }, undefined)).toBeUndefined();
    expect(enlargementFor({}, answers)).toBeUndefined();
  });

  it("applies the articles to the answered division", () => {
    expect(enlargementFor({ division: "A-2" }, answers)?.regime).toBe(
      "keep_and_extend",
    );
    expect(
      enlargementFor({ division: "F-6" }, { ...answers, raisesRigor: true })
        ?.regime,
    ).toBe("in1_enlarged_only");
  });
});
