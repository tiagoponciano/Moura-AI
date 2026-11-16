import { describe, expect, it } from "vitest";
import { EMPTY_STATE, hasState, pickState } from "./classification-state";

const part = {
  division: "C-2",
  area_m2: 500,
  top_height_m: 8,
  storeys: 2,
  separation: "open",
};
const enlargement = {
  originalAreaM2: 700,
  addedAreaM2: 100,
  originalRegularized: true,
  compartmented: true,
  newIsolatedBlock: false,
  graceYearsMet: true,
  raisesRigor: false,
};

describe("pickState", () => {
  it("keeps every valid part of the state", () => {
    const state = pickState({
      facts: { division: "C-2", area_m2: 700 },
      parts: [part, { ...part, division: "A-2" }],
      enlargement,
      faults: ["D5"],
    });
    expect(state.facts).toEqual({ division: "C-2", area_m2: 700 });
    expect(state.parts).toHaveLength(2);
    expect(state.enlargement).toEqual(enlargement);
    expect(state.faults).toEqual(["D5"]);
  });

  it("drops an invalid part without losing the others", () => {
    const state = pickState({
      facts: { division: "C-2" },
      parts: [{ division: "Z-9" }],
      enlargement: { addedAreaM2: -1 },
      faults: ["D99"],
    });
    expect(state.facts).toEqual({ division: "C-2" });
    expect(state.parts).toEqual([]);
    expect(state.enlargement).toBeUndefined();
    expect(state.faults).toEqual([]);
  });

  it("is empty for anything that is not an object", () => {
    for (const raw of [undefined, null, "x", 3, []]) {
      expect(hasState(pickState(raw))).toBe(false);
    }
  });

  it("drops a fact the registry does not know", () => {
    expect(pickState({ facts: { nope: 1 } }).facts).toEqual({});
  });

  it("is stable: picking a picked state changes nothing", () => {
    const once = pickState({
      facts: { division: "C-2" },
      parts: [part],
      enlargement,
    });
    expect(pickState(once)).toEqual(once);
  });
});

describe("hasState", () => {
  it("is false for the empty state and true once anything is there", () => {
    expect(hasState(EMPTY_STATE)).toBe(false);
    expect(hasState({ ...EMPTY_STATE, faults: ["D1"] })).toBe(true);
    expect(hasState({ ...EMPTY_STATE, facts: { division: "C-2" } })).toBe(true);
  });
});
