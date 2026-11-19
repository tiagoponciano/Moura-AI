import { describe, expect, it } from "vitest";
import { formatRetrieved, normLabel, normsSummary } from "./norms";

const norm = (needsHumanLook: number) => ({
  doc: "IN-3",
  sourceUrl: "",
  retrieved: "2026-11-12",
  pages: 1,
  needsHumanLook,
});

describe("normsSummary", () => {
  it("waits for the list", () => {
    expect(normsSummary(undefined)).toBe("Carregando…");
  });

  it("counts the norms and the items that wait for a person", () => {
    expect(normsSummary([norm(2), norm(1)])).toBe("2 normas · 3 a conferir");
  });

  it("says nothing about checks when none is left", () => {
    expect(normsSummary([norm(0)])).toBe("1 norma");
  });
});

describe("formatRetrieved", () => {
  it("writes a date the Brazilian way and leaves other text alone", () => {
    expect(formatRetrieved("2026-11-19")).toBe("19/11/2026");
    expect(formatRetrieved("ontem")).toBe("ontem");
  });
});

describe("normLabel", () => {
  it("names the instruction and its part", () => {
    expect(normLabel("IN-1-P2")).toBe("IN 1 parte 2");
    expect(normLabel("IN-5")).toBe("IN 5");
    expect(normLabel("NT-1")).toBe("NT-1");
  });
});
