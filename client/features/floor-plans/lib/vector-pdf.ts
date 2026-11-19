import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import { type Plan, PT_TO_MM } from "./plan-geometry";

const BEZIER_STEPS = 6;
/** A page with fewer strokes than this is a scan or a photo inside a PDF. */
const MIN_VECTOR_STROKES = 20;

/** pdf.js path commands, `DrawOPS` in its source. */
const MOVE_TO = 0;
const LINE_TO = 1;
const CURVE_TO = 2;
const QUADRATIC_TO = 3;
const CLOSE = 4;

type Matrix = [number, number, number, number, number, number];
type Point = [number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** `inner` applied first, then `outer`, as PDF's `cm` concatenates. */
const multiply = (outer: Matrix, inner: Matrix): Matrix => [
  inner[0] * outer[0] + inner[1] * outer[2],
  inner[0] * outer[1] + inner[1] * outer[3],
  inner[2] * outer[0] + inner[3] * outer[2],
  inner[2] * outer[1] + inner[3] * outer[3],
  inner[4] * outer[0] + inner[5] * outer[2] + outer[4],
  inner[4] * outer[1] + inner[5] * outer[3] + outer[5],
];

const apply = (m: Matrix, x: number, y: number): Point => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

function cubic(p0: Point, p1: Point, p2: Point, p3: Point): Point[] {
  return Array.from({ length: BEZIER_STEPS + 1 }, (_, step) => {
    const t = step / BEZIER_STEPS;
    const mt = 1 - t;
    const at = (i: 0 | 1) =>
      mt ** 3 * p0[i] +
      3 * mt ** 2 * t * p1[i] +
      3 * mt * t ** 2 * p2[i] +
      t ** 3 * p3[i];
    return [at(0), at(1)];
  });
}

/** The straight segments of one pdf.js path, curves split into short lines. */
function segments(data: ArrayLike<number>, ctm: Matrix): [Point, Point][] {
  const found: [Point, Point][] = [];
  let start: Point | undefined;
  let current: Point | undefined;
  const take = (n: number, i: number) =>
    Array.from({ length: n }, (_, k) =>
      apply(ctm, data[i + 2 * k], data[i + 2 * k + 1]),
    );
  for (let i = 0; i < data.length;) {
    const op = data[i++];
    if (op === MOVE_TO) {
      [current] = take(1, i);
      start = current;
      i += 2;
    } else if (op === LINE_TO) {
      const [next] = take(1, i);
      if (current) found.push([current, next]);
      current = next;
      i += 2;
    } else if (op === CURVE_TO || op === QUADRATIC_TO) {
      const n = op === CURVE_TO ? 3 : 2;
      const points = take(n, i);
      i += 2 * n;
      if (!current) continue;
      const [c1, c2, end] =
        n === 3
          ? points
          : [
              [
                current[0] + (2 / 3) * (points[0][0] - current[0]),
                current[1] + (2 / 3) * (points[0][1] - current[1]),
              ] as Point,
              [
                points[1][0] + (2 / 3) * (points[0][0] - points[1][0]),
                points[1][1] + (2 / 3) * (points[0][1] - points[1][1]),
              ] as Point,
              points[1],
            ];
      const curve = cubic(current, c1, c2, end);
      for (let k = 1; k < curve.length; k++) {
        found.push([curve[k - 1], curve[k]]);
      }
      current = end;
    } else if (op === CLOSE) {
      if (current && start) found.push([current, start]);
      current = start;
    } else {
      break;
    }
  }
  return found;
}

/**
 * The first page's lines and texts, in millimeters with y up from the page's
 * lower left corner, or `undefined` when it holds too few strokes to be a CAD
 * export. Clipping paths are not drawn, so they are left out.
 */
export async function readVectorPdf(
  pdf: Uint8Array,
): Promise<Plan | undefined> {
  const { OPS } = await getResolvedPDFJS();
  const document = await getDocumentProxy(pdf.slice());
  try {
    const page = await document.getPage(1);
    const [x0, y0, x1, y1] = page.view;
    const toMm = ([x, y]: Point): Point => [
      (x - x0) * PT_TO_MM,
      (y - y0) * PT_TO_MM,
    ];
    const plan: Plan = {
      width: (x1 - x0) * PT_TO_MM,
      height: (y1 - y0) * PT_TO_MM,
      lines: [],
      texts: [],
    };

    const { fnArray, argsArray } = await page.getOperatorList();
    const stack: Matrix[] = [];
    let ctm = IDENTITY;
    let strokes = 0;
    fnArray.forEach((fn, index) => {
      const args = argsArray[index];
      if (fn === OPS.save) stack.push(ctm);
      else if (fn === OPS.restore) ctm = stack.pop() ?? IDENTITY;
      else if (fn === OPS.transform) ctm = multiply(ctm, args as Matrix);
      else if (fn === OPS.paintFormXObjectBegin) {
        stack.push(ctm);
        if (args[0]) ctm = multiply(ctm, Array.from(args[0]) as Matrix);
      } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? IDENTITY;
      else if (fn === OPS.constructPath && args[0] !== OPS.endPath) {
        const data = args[1]?.[0];
        if (!data) return;
        for (const [a, b] of segments(data, ctm)) {
          strokes++;
          const [ax, ay] = toMm(a);
          const [bx, by] = toMm(b);
          if (ax !== bx || ay !== by) {
            plan.lines.push({ x1: ax, y1: ay, x2: bx, y2: by });
          }
        }
      }
    });
    if (strokes < MIN_VECTOR_STROKES) return undefined;

    const { items } = await page.getTextContent();
    for (const item of items) {
      if (!("str" in item)) continue;
      const value = item.str.trim();
      if (!value) continue;
      const [, , c, d, e, f] = item.transform as Matrix;
      const [x, y] = toMm([e, f]);
      plan.texts.push({ x, y, height: Math.hypot(c, d) * PT_TO_MM, value });
    }
    return plan;
  } finally {
    await document.loadingTask.destroy();
  }
}
