import { describe, expect, it } from "vitest";
import { z } from "zod";
import { QUESTIONS } from "../lib/questions";
import { recordAnswers, recordAnswersInput } from "./record-answers";

const DATE = "2026-11-12";

describe("recordAnswersInput", () => {
  it("accepts valid answers and a list of facts the user does not know", () => {
    const parsed = recordAnswersInput.safeParse({
      division: "C-2",
      area_m2: 800,
      storeys: 2,
      single_block: true,
      unknown: ["fire_load_class"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a value the registry does not accept", () => {
    for (const bad of [
      { area_m2: -1 },
      { storeys: 1.5 },
      { division: "Z-9" },
      { single_block: "yes" },
      { fire_load_class: "huge" },
    ]) {
      expect(
        recordAnswersInput.safeParse(bad).success,
        JSON.stringify(bad),
      ).toBe(false);
    }
  });

  it("rejects não sei for a fact that must be answered", () => {
    expect(recordAnswersInput.safeParse({ unknown: ["area_m2"] }).success).toBe(
      false,
    );
  });

  it("serializes to the JSON schema the model provider receives, with every fact", () => {
    const schema = z.toJSONSchema(recordAnswersInput) as {
      properties: Record<string, { enum?: string[]; type?: string }>;
    };
    expect(Object.keys(schema.properties).sort()).toEqual(
      [...QUESTIONS.map((q) => q.fact), "unknown"].sort(),
    );
    expect(schema.properties.division.enum).toEqual(
      expect.arrayContaining(["C-1", "C-2", "C-3", "D-1", "M-11", "other"]),
    );
    expect(schema.properties.division.enum).not.toContain("Z-9");
    expect(schema.properties.storeys.type).toBe("integer");
  });

  it("describes each field for the model", () => {
    const shape = recordAnswersInput.shape as Record<
      string,
      { description?: string }
    >;
    expect(shape.storeys.description).toContain(
      "Never derive it from the height",
    );
    expect(shape.unknown.description).toContain("Never guess");
  });
});

describe("recordAnswers", () => {
  it("echoes the validated answers and drops anything invalid", () => {
    const out = recordAnswers(
      { area_m2: 800, storeys: -2, colour: "red" },
      {},
      DATE,
    );
    expect(out.answers).toEqual({ area_m2: 800 });
  });

  it("names the recorded facts in `fields`, for the chat's status line", () => {
    const out = recordAnswers(
      { area_m2: 800, storeys: 2, unknown: ["single_use"] },
      {},
      DATE,
    );
    expect(out.fields).toEqual(["area_m2", "storeys", "single_use"]);
  });

  it("returns the não sei facts", () => {
    const out = recordAnswers({ unknown: ["single_use"] }, {}, DATE);
    expect(out.unknown).toEqual(["single_use"]);
  });

  it("tells the model what to ask next, given what the panel already holds", () => {
    const state = { division: "C-2", area_m2: 700 };
    const out = recordAnswers({ storeys: 2 }, state, DATE);
    expect(out.status).toBe("pending");
    expect(out.next).toEqual([
      {
        facts: ["height_m"],
        ask: "Qual é a altura da edificação, em metros, do piso mais baixo ocupado ao piso do último pavimento?",
      },
    ]);
  });

  it("does not ask the height of a single-storey building", () => {
    const state = {
      division: "C-2",
      area_m2: 700,
      single_block: true,
      single_use: true,
      storage_over_3_5m: false,
    };
    const out = recordAnswers({ storeys: 1 }, state, DATE);
    expect(out.next).toEqual([]);
    expect(out.status).toBe("complete");
  });

  it("reports a specific analysis without listing systems", () => {
    const state = {
      division: "C-2",
      storeys: 2,
      height_m: 8,
      single_block: true,
      single_use: true,
      storage_over_3_5m: false,
    };
    const out = recordAnswers({ area_m2: 750 }, state, DATE);
    expect(out.status).toBe("analysis");
    expect(out).not.toHaveProperty("systems");
  });
});
