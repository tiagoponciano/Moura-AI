import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PT_TO_MM } from "./plan-geometry";
import { readVectorPdf } from "./vector-pdf";

/** Made with PyMuPDF like the DWG service's tests: a 400 x 300 pt room, an inner wall, 25 short strokes and "SALA 01". */
const fixture = (name: string) =>
  new Uint8Array(readFileSync(join(__dirname, "fixtures", name)));

describe("readVectorPdf", () => {
  it("reads the strokes a CAD export draws, as the DWG service does", async () => {
    const plan = await readVectorPdf(fixture("vector-plan.pdf"));
    expect(plan?.lines).toHaveLength(31);
  });

  it("keeps the measures, in millimeters", async () => {
    const plan = (await readVectorPdf(fixture("vector-plan.pdf")))!;
    const widths = plan.lines
      .filter((line) => Math.abs(line.y1 - line.y2) < 1e-6)
      .map((line) => Math.abs(line.x2 - line.x1));
    expect(Math.max(...widths)).toBeCloseTo(400 * PT_TO_MM, 6);
    expect(plan.width).toBeCloseTo(595 * PT_TO_MM, 6);
    expect(plan.height).toBeCloseTo(842 * PT_TO_MM, 6);
  });

  it("measures y up from the bottom of the page", async () => {
    const plan = (await readVectorPdf(fixture("vector-plan.pdf")))!;
    const top = Math.max(...plan.lines.map((line) => line.y1));
    expect(top / PT_TO_MM).toBeCloseTo(842 - 100, 6);
  });

  it("reads the texts with their position and height", async () => {
    const plan = (await readVectorPdf(fixture("vector-plan.pdf")))!;
    expect(plan.texts).toHaveLength(1);
    const [text] = plan.texts;
    expect(text.value).toBe("SALA 01");
    expect(text.x).toBeCloseTo(42.33, 2);
    expect(text.y).toBeCloseTo(268.82, 2);
    expect(text.height).toBeCloseTo(4.23, 2);
  });

  it("does not take a page with few strokes for a CAD export", async () => {
    expect(await readVectorPdf(fixture("few-strokes.pdf"))).toBeUndefined();
  });

  it("rejects a file that is not a PDF", async () => {
    await expect(
      readVectorPdf(new TextEncoder().encode("not a pdf")),
    ).rejects.toThrow();
  });
});
