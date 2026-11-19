import type { Plan } from "./plan-geometry";

export const LINE_LAYER = "LINHAS";
export const TEXT_LAYER = "TEXTO";
const MIN_TEXT_HEIGHT = 0.5;

/** A number as DXF writes it: no exponent, at most six decimals. */
const num = (value: number) => String(Number(value.toFixed(6)));

/**
 * Text for an R12 DXF, which is not UTF-8: anything outside printable ASCII is
 * written as `\U+XXXX`, which AutoCAD and other CAD programs read back.
 */
export function dxfText(value: string): string {
  return Array.from(value.replace(/[\r\n]+/g, " "), (char) => {
    const code = char.codePointAt(0)!;
    return code >= 32 && code < 127
      ? char
      : `\\U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }).join("");
}

const pairs = (...entries: (string | number)[][]) =>
  entries.map(([code, value]) => `${code}\n${value}`).join("\n");

function layer(name: string, color: number) {
  return pairs(
    [0, "LAYER"],
    [2, name],
    [70, 0],
    [62, color],
    [6, "CONTINUOUS"],
  );
}

/**
 * The plan as an R12 (AC1009) DXF, in millimeters: lines on `LINHAS`, texts
 * on `TEXTO`. R12 needs no handles or objects section and every CAD program
 * opens it.
 */
export function planToDxf(plan: Plan): string {
  const header = pairs(
    [0, "SECTION"],
    [2, "HEADER"],
    [9, "$ACADVER"],
    [1, "AC1009"],
    [9, "$INSUNITS"],
    [70, 4],
    [9, "$EXTMIN"],
    [10, 0],
    [20, 0],
    [9, "$EXTMAX"],
    [10, num(plan.width)],
    [20, num(plan.height)],
    [0, "ENDSEC"],
  );
  const tables = [
    pairs([0, "SECTION"], [2, "TABLES"], [0, "TABLE"], [2, "LAYER"], [70, 2]),
    layer(LINE_LAYER, 7),
    layer(TEXT_LAYER, 2),
    pairs([0, "ENDTAB"], [0, "ENDSEC"]),
  ].join("\n");
  const lines = plan.lines.map((line) =>
    pairs(
      [0, "LINE"],
      [8, LINE_LAYER],
      [10, num(line.x1)],
      [20, num(line.y1)],
      [30, 0],
      [11, num(line.x2)],
      [21, num(line.y2)],
      [31, 0],
    ),
  );
  const texts = plan.texts.map((text) =>
    pairs(
      [0, "TEXT"],
      [8, TEXT_LAYER],
      [10, num(text.x)],
      [20, num(text.y)],
      [30, 0],
      [40, num(Math.max(text.height, MIN_TEXT_HEIGHT))],
      [1, dxfText(text.value)],
    ),
  );
  const entities = [
    pairs([0, "SECTION"], [2, "ENTITIES"]),
    ...lines,
    ...texts,
    pairs([0, "ENDSEC"]),
  ].join("\n");
  return [header, tables, entities, pairs([0, "EOF"])].join("\n") + "\n";
}
