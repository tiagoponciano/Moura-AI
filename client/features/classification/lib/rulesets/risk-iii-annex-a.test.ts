import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateRules } from "../engine/evaluate-rules";
import type { Facts } from "../engine/types";
import { ALL_RULES } from "./all-rules";

const DATE = "2026-11-19";

type Row = { group: string; division: string; height: string; area: string };
const annex = JSON.parse(
  readFileSync(join(__dirname, "../../norms/in-1-p1/annex-a.json"), "utf-8"),
) as { quadro_2_risco_iii_area_altura: Row[] };

/** Divisions a quadro 2 cell names, with the fire load class when it says one. */
function divisionsOf(cell: string): { division: string; load?: string }[] {
  if (cell === "Todas") {
    return ["D-1", "D-2", "D-3", "D-4"].map((division) => ({ division }));
  }
  return cell.split(",").map((part) => {
    const match = /^([A-M]-\d+)(?: \(CI (média|alta)\))?$/.exec(part.trim());
    if (!match) throw new Error(`unexpected division cell: ${cell}`);
    const load =
      match[2] === "média" ? "medium" : match[2] ? "high" : undefined;
    return { division: match[1], load };
  });
}

/** The tallest building the height cell allows, as the facts the rules read. */
function heightFacts(cell: string): Facts {
  if (cell === "TÉRREO") return { storeys: 1, height_m: 5 };
  const upper = /≤\s*(\d+)\s*$/.exec(cell);
  if (!upper) throw new Error(`unexpected height cell: ${cell}`);
  return { storeys: 4, height_m: Number(upper[1]) };
}

const areaLimit = (cell: string) =>
  Number(/≤\s*([\d.]+)/.exec(cell)![1].replace(".", ""));

const level = (facts: Facts) => {
  const outcome = evaluateRules(ALL_RULES, facts, DATE).risk;
  return outcome.status === "decided" ? outcome.level : outcome.status;
};

const build = (
  division: string,
  load: string | undefined,
  height: Facts,
  area_m2: number,
): Facts => ({
  division,
  fire_load_class: load ?? "medium",
  special_risks: false,
  risk_exempt: false,
  has_basement: false,
  single_block: true,
  area_m2,
  ...height,
});

describe("risk III rules against Annex A, quadro 2, as extracted", () => {
  for (const row of annex.quadro_2_risco_iii_area_altura) {
    for (const { division, load } of divisionsOf(row.division)) {
      const label = `${division}${load ? ` (CI ${load})` : ""}, ${row.height}, ${row.area}`;
      const limit = areaLimit(row.area);
      const height = heightFacts(row.height);
      // Up to 750 m² on three storeys or fewer, risk II applies before III.
      const II_OR_III = limit <= 750 && height.storeys === 1;

      it(`${label}: still risk II or III at the area limit`, () => {
        const got = level(build(division, load, height, limit));
        expect(II_OR_III ? ["II", "III"] : ["III"]).toContain(got);
      });

      it(`${label}: risk IV one square meter above the limit`, () => {
        expect(level(build(division, load, height, limit + 1))).toBe("IV");
      });
    }
  }
});
