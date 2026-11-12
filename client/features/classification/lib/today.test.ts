import { describe, expect, it } from "vitest";
import { analysisDate } from "./today";

describe("analysisDate", () => {
  it("formats the date as YYYY-MM-DD", () => {
    expect(analysisDate(new Date("2026-11-12T15:00:00Z"))).toBe("2026-11-12");
  });

  it("uses the date in São Paulo, not in UTC", () => {
    // 02:00 UTC on the 13th is still the 12th at 23:00 in São Paulo (UTC-3).
    expect(analysisDate(new Date("2026-11-13T02:00:00Z"))).toBe("2026-11-12");
  });
});
