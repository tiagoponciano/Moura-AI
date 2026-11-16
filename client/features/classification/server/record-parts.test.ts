import { describe, expect, it } from "vitest";
import type { Facts } from "../lib/engine/types";
import { recordParts, recordPartsInput } from "./record-parts";

const DATE = "2026-11-12";
const state: Facts = {
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  storage_over_3_5m: false,
  single_use: false,
  only_subsidiary: false,
};
const part = (division: string, area_m2: number) => ({
  division,
  area_m2,
  top_height_m: 8,
  storeys: 3,
  separation: "open" as const,
});

describe("recordPartsInput", () => {
  it("needs at least two occupations", () => {
    expect(
      recordPartsInput.safeParse({ parts: [part("C-2", 1000)] }).success,
    ).toBe(false);
    expect(
      recordPartsInput.safeParse({
        parts: [part("A-2", 500), part("C-2", 1500)],
      }).success,
    ).toBe(true);
  });

  it("describes every field without accents, since the model reads it", () => {
    const text = JSON.stringify(recordPartsInput.toJSONSchema());
    expect(text).not.toMatch(/[À-ÿ]/);
  });
});

describe("recordParts", () => {
  it("echoes the validated occupations for the client to keep", () => {
    const parts = [part("A-2", 500), part("C-2", 1500)];
    const result = recordParts({ parts }, state, DATE);
    expect(result.parts).toEqual(parts);
    expect(result.summary).toBe("Ocupações registradas: A-2, C-2");
  });

  it("is the same result when the same list is sent again, so a replayed chat settles", () => {
    const input = { parts: [part("A-2", 500), part("C-2", 1500)] };
    expect(recordParts(input, state, DATE)).toEqual(
      recordParts(input, state, DATE),
    );
  });

  it("records nothing for an invalid list", () => {
    const result = recordParts({ parts: [{ division: "Z-9" }] }, state, DATE);
    expect(result.parts).toEqual([]);
    expect(result.summary).toBe("Ocupações não registradas");
  });
});
