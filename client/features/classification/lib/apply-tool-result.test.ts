import { describe, expect, it } from "vitest";
import { applyPanelEdit, applyToolResult } from "./apply-tool-result";
import { EMPTY_STATE, type ClassificationState } from "./classification-state";

const part = {
  division: "C-2",
  area_m2: 500,
  top_height_m: 8,
  storeys: 2,
  separation: "open" as const,
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

describe("applyToolResult", () => {
  it("merges recorded answers over the facts and names what they touched", () => {
    const change = applyToolResult(
      { ...EMPTY_STATE, facts: { division: "C-2" } },
      "record_answers",
      { area_m2: 700, unknown: ["has_basement"] },
    );
    expect(change?.next.facts).toEqual({
      division: "C-2",
      area_m2: 700,
      has_basement: null,
    });
    expect(change?.touched).toEqual(["area_m2", "has_basement"]);
  });

  it("changes nothing for answers that carry nothing", () => {
    expect(applyToolResult(EMPTY_STATE, "record_answers", {})).toBeUndefined();
  });

  it("replaces the list of occupations, the enlargement and the faults whole", () => {
    const after = (name: string, output: unknown, from = EMPTY_STATE) =>
      applyToolResult(from, name, output)?.next;
    expect(after("record_parts", { parts: [part, part] })?.parts).toHaveLength(
      2,
    );
    expect(after("record_enlargement", { enlargement })?.enlargement).toEqual(
      enlargement,
    );
    expect(after("record_faults", { faults: ["D5"] })?.faults).toEqual(["D5"]);
    const from: ClassificationState = { ...EMPTY_STATE, faults: ["D1", "D2"] };
    expect(after("record_faults", { faults: ["D5"] }, from)?.faults).toEqual([
      "D5",
    ]);
  });

  it("ends in the same state when a chat is replayed twice", () => {
    const steps: [string, unknown][] = [
      ["record_answers", { division: "C-2" }],
      ["record_parts", { parts: [part, part] }],
      ["record_faults", { faults: ["D5"] }],
    ];
    const run = (from: ClassificationState) =>
      steps.reduce(
        (state, [name, output]) =>
          applyToolResult(state, name, output)?.next ?? state,
        from,
      );
    const once = run(EMPTY_STATE);
    expect(run(once)).toEqual(once);
  });

  it("ignores a tool it does not know", () => {
    expect(applyToolResult(EMPTY_STATE, "other", { x: 1 })).toBeUndefined();
  });
});

describe("applyPanelEdit", () => {
  it("sets, clears and marks as unknown a fact typed in the panel", () => {
    const set = applyPanelEdit(EMPTY_STATE, "division", "C-2");
    expect(set.facts.division).toBe("C-2");
    expect(
      applyPanelEdit(set, "division", undefined).facts.division,
    ).toBeUndefined();
    expect(
      applyPanelEdit(EMPTY_STATE, "single_use", null).facts.single_use,
    ).toBeNull();
  });

  it("keeps the occupations, the enlargement and the faults", () => {
    const from: ClassificationState = { ...EMPTY_STATE, faults: ["D5"] };
    expect(applyPanelEdit(from, "division", "C-2").faults).toEqual(["D5"]);
  });
});
