import { describe, expect, it } from "vitest";
import { pageRange } from "./page-range";

describe("pageRange", () => {
  it("names the rows on the page", () => {
    expect(pageRange(0, 10, 23)).toBe("Mostrando 1 a 10 de 23");
    expect(pageRange(2, 10, 23)).toBe("Mostrando 21 a 23 de 23");
  });

  it("is empty for no rows", () => {
    expect(pageRange(0, 10, 0)).toBeUndefined();
  });
});
