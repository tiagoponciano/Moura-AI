import { describe, expect, it } from "vitest";
import type { Facts } from "./engine/types";
import {
  classifyWithParts,
  MAX_PARTS,
  mixedKind,
  needsParts,
  pickParts,
} from "./mixed-parts";

const DATE = "2026-11-12";
const answers: Facts = {
  fire_load_class: "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  storage_over_3_5m: false,
  single_block: true,
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

describe("pickParts", () => {
  it("keeps a valid list", () => {
    const parts = [part("A-2", 500), part("C-2", 1500)];
    expect(pickParts(parts)).toEqual(parts);
  });

  it("drops the whole list when one occupation is invalid", () => {
    expect(
      pickParts([part("A-2", 500), { ...part("C-2", 1), area_m2: -1 }]),
    ).toEqual([]);
    expect(pickParts([part("Z-9", 500)])).toEqual([]);
    expect(pickParts("nothing")).toEqual([]);
  });

  it("drops a list longer than the limit", () => {
    const many = Array.from({ length: MAX_PARTS + 1 }, () => part("C-2", 100));
    expect(pickParts(many)).toEqual([]);
  });
});

describe("mixedKind", () => {
  it("is mixed when the secondary areas are more than 10% of the building", () => {
    expect(mixedKind([part("A-2", 800), part("C-2", 200)])).toBe("mixed");
  });

  it("is secondary at 10% or less, the boundary included", () => {
    expect(mixedKind([part("A-2", 900), part("C-2", 100)])).toBe("secondary");
    expect(mixedKind([part("A-2", 950), part("C-2", 50)])).toBe("secondary");
  });
});

describe("classifyWithParts", () => {
  it("uses the plain classification when the property has one use", () => {
    const one = { ...answers, single_use: true };
    expect(needsParts(one)).toBe(false);
    expect(classifyWithParts(one, [], DATE).status).not.toBe("analysis");
  });

  it("uses the plain classification when the other occupations are only subsidiary", () => {
    expect(needsParts({ ...answers, only_subsidiary: true })).toBe(false);
  });

  it("waits and asks for the occupations instead of stopping at an analysis", () => {
    const c = classifyWithParts(answers, [], DATE);
    expect(c.status).toBe("pending");
    expect(c.analyses).toEqual([]);
    expect(c.next?.facts).toEqual(["occupation_parts"]);
  });

  it("asks again with a single occupation, since a mixed building has at least two", () => {
    const c = classifyWithParts(answers, [part("C-2", 1500)], DATE);
    expect(c.next?.facts).toEqual(["occupation_parts"]);
  });

  it("joins the occupations once there are two", () => {
    const c = classifyWithParts(
      answers,
      [part("A-2", 500), part("C-2", 1500)],
      DATE,
    );
    expect(c.next?.facts).not.toEqual(["occupation_parts"]);
    expect(
      c.groups.required.length + c.groups.notRequired.length,
    ).toBeGreaterThan(0);
  });
});
