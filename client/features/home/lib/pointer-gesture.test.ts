import { describe, expect, it } from "vitest";
import { isClick } from "./pointer-gesture";

describe("isClick", () => {
  it("treats a release next to the press as a click", () => {
    expect(isClick({ x: 100, y: 100 }, { x: 103, y: 98 })).toBe(true);
  });

  it("treats a release after dragging as a rotation, not a click", () => {
    expect(isClick({ x: 100, y: 100 }, { x: 160, y: 104 })).toBe(false);
  });

  it("is not a click when there was no press on the canvas", () => {
    expect(isClick(null, { x: 100, y: 100 })).toBe(false);
  });
});
