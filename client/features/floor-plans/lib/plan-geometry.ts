/** PDF points to millimeters. */
export const PT_TO_MM = 25.4 / 72;

export type PlanLine = { x1: number; y1: number; x2: number; y2: number };
export type PlanText = { x: number; y: number; height: number; value: string };

/** What a plan holds once read: lines and texts in millimeters on paper, y up. */
export type Plan = {
  width: number;
  height: number;
  lines: PlanLine[];
  texts: PlanText[];
};

/** The plan at real size: every coordinate and text height times the drawing's scale denominator. */
export function scalePlan(plan: Plan, factor: number): Plan {
  return {
    width: plan.width * factor,
    height: plan.height * factor,
    lines: plan.lines.map((line) => ({
      x1: line.x1 * factor,
      y1: line.y1 * factor,
      x2: line.x2 * factor,
      y2: line.y2 * factor,
    })),
    texts: plan.texts.map((text) => ({
      ...text,
      x: text.x * factor,
      y: text.y * factor,
      height: text.height * factor,
    })),
  };
}
