import { describe, expect, it } from "vitest";
import { dxfText, LINE_LAYER, planToDxf, TEXT_LAYER } from "./plan-dxf";
import { type Plan, scalePlan } from "./plan-geometry";

const plan: Plan = {
  width: 210,
  height: 297,
  lines: [
    { x1: 10, y1: 20, x2: 110, y2: 20 },
    { x1: 110, y1: 20, x2: 110, y2: 0.1234567 },
  ],
  texts: [{ x: 15, y: 25, height: 0.2, value: "SALA 01" }],
};

/** The DXF as group code and value pairs. */
const groups = (dxf: string) => {
  const rows = dxf.trimEnd().split("\n");
  return Array.from({ length: rows.length / 2 }, (_, i) => [
    rows[2 * i],
    rows[2 * i + 1],
  ]);
};

const entities = (dxf: string, kind: string) =>
  groups(dxf).filter(([code, value]) => code === "0" && value === kind);

describe("planToDxf", () => {
  it("writes an R12 file in millimeters", () => {
    const dxf = planToDxf(plan);
    expect(dxf).toContain("$ACADVER\n1\nAC1009");
    expect(dxf).toContain("$INSUNITS\n70\n4");
    expect(dxf.trimEnd().endsWith("0\nEOF")).toBe(true);
  });

  it("has one LINE per line and one TEXT per text", () => {
    const dxf = planToDxf(plan);
    expect(entities(dxf, "LINE")).toHaveLength(2);
    expect(entities(dxf, "TEXT")).toHaveLength(1);
  });

  it("puts lines and texts on their own layers", () => {
    const dxf = planToDxf(plan);
    expect(dxf).toContain(`0\nLINE\n8\n${LINE_LAYER}\n10\n10\n20\n20`);
    expect(dxf).toContain(`0\nTEXT\n8\n${TEXT_LAYER}`);
  });

  it("rounds coordinates to six decimals", () => {
    expect(planToDxf(plan)).toContain("21\n0.123457");
  });

  it("gives a tiny text a readable height", () => {
    expect(planToDxf(plan)).toContain("40\n0.5\n1\nSALA 01");
  });

  it("writes an empty plan as a valid file with no entities", () => {
    const dxf = planToDxf({ width: 1, height: 1, lines: [], texts: [] });
    expect(entities(dxf, "LINE")).toHaveLength(0);
    expect(dxf).toContain("ENTITIES\n0\nENDSEC");
  });
});

describe("dxfText", () => {
  it("escapes accented letters for CAD programs", () => {
    expect(dxfText("Área de serviço")).toBe("\\U+00C1rea de servi\\U+00E7o");
  });

  it("puts a multiline text on one line", () => {
    expect(dxfText("SALA\n01")).toBe("SALA 01");
  });
});

describe("scalePlan", () => {
  it("multiplies coordinates, sizes and text heights by the scale", () => {
    const scaled = scalePlan(plan, 100);
    expect(scaled.width).toBe(21000);
    expect(scaled.lines[0]).toEqual({
      x1: 1000,
      y1: 2000,
      x2: 11000,
      y2: 2000,
    });
    expect(scaled.texts[0]).toMatchObject({ x: 1500, height: 20 });
  });
});
