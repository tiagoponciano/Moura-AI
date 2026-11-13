import { evaluateRules } from "./engine/evaluate-rules";
import type { Evaluation, Facts, Rule } from "./engine/types";
import { ALL_RULES } from "./rulesets/all-rules";

/** How a part of the building relates to the others (IN 1 parte 2, art. 11). */
export type Separation = "isolated" | "compartmented" | "open";

/** One occupation of the building and the space it takes. */
export type OccupationPart = {
  division: string;
  area_m2: number;
  /** Height of the part's last floor, in meters, counted from the lowest occupied floor. */
  top_height_m: number;
  /** Storeys of the part. */
  storeys: number;
  separation: Separation;
  fire_load_class?: string;
};

/**
 * `mixed` (art. 11): the secondary areas are more than 10% of the building. `secondary`
 * (art. 12): there are secondary occupations that do not make it mixed. The caller
 * decides which one holds, with the criteria of IN 1 parte 1, art. 4º.
 */
export type MixedKind = "mixed" | "secondary";

export type MixedInput = {
  kind: MixedKind;
  /** Facts shared by every part: the answers that do not depend on the occupation. */
  base: Facts;
  /** The predominant occupation comes first. */
  parts: OccupationPart[];
};

export type MixedSystem = {
  id: string;
  status: "required" | "needs_info" | "not_required";
  vital: boolean;
  /** Divisions whose table requires it. */
  from: string[];
  /** Parts of the building it is limited to; empty for the whole building. */
  scopes: string[];
};

export type MixedResult = {
  systems: MixedSystem[];
  /** Specific analyses any part ended in. */
  analyses: string[];
  /** What the norm adds that the code does not apply. */
  notes: string[];
  /** The evaluation of each part, with the facts it was given. */
  parts: { division: string; facts: Facts; evaluation: Evaluation }[];
};

/**
 * Systems that art. 11, III lets a compartmented part size by itself: always
 * sprinklers, smoke control and horizontal compartmentation on a single storey; on
 * more storeys, horizontal compartmentation, smoke control, the emergency elevator
 * below 21 m and the sprinklers of residential areas.
 */
function autonomous(
  systemId: string,
  part: OccupationPart,
  singleStorey: boolean,
): boolean {
  if (["horizontal_compartmentation", "smoke_control"].includes(systemId))
    return true;
  if (singleStorey) return systemId === "sprinklers";
  if (systemId === "emergency_elevator") return part.top_height_m < 21;
  if (systemId === "sprinklers") return part.division.startsWith("A-");
  return false;
}

const NOTES = {
  vertical:
    "Compartimentação vertical (art. 11, parágrafo único): quando exigida, e as suas possíveis substituições, aplica-se a todas as ocupações dos pavimentos inferiores. O código não replica a exigência nesses pavimentos.",
  garage:
    "Garagem (arts. 10, § 1º, e 12, § 2º): pavimentos e áreas de garagem devem ser compartimentados em relação aos acessos, às escadas e à descarga da edificação, qualquer que seja a tabela.",
};

const worse = (
  a: MixedSystem["status"],
  b: MixedSystem["status"],
): MixedSystem["status"] =>
  a === "required" || b === "required"
    ? "required"
    : a === "needs_info" || b === "needs_info"
      ? "needs_info"
      : "not_required";

/**
 * The systems of a building with more than one occupation, by running the
 * single-occupation rules once per part and joining the results as arts. 11 and 12
 * say. It decides nothing the rules do not say: each part is classified by its own
 * tables, and only the facts they read (area, height, storeys, fire load) change.
 */
export function classifyMixed(
  input: MixedInput,
  analysisDate: string,
  rules: Rule[] = ALL_RULES,
): MixedResult {
  const { base, parts, kind } = input;
  if (parts.length === 0) throw new RangeError("parts must not be empty");

  const open = parts.filter((p) => p.separation !== "isolated");
  const openArea = open.reduce((sum, p) => sum + p.area_m2, 0);
  const buildingHeight = Math.max(...parts.map((p) => p.top_height_m));
  const buildingStoreys = Math.max(...parts.map((p) => p.storeys));
  const singleStorey = buildingStoreys === 1;
  const allCompartmented = open.every((p) => p.separation === "compartmented");

  const factsOf = (
    part: OccupationPart,
    area: number,
    height: number,
  ): Facts => ({
    ...base,
    division: part.division,
    area_m2: area,
    height_m: height,
    storeys: part.storeys,
    ...(part.fire_load_class && { fire_load_class: part.fire_load_class }),
    single_block: true,
    single_use: true,
  });
  const run = (facts: Facts) => evaluateRules(rules, facts, analysisDate);

  type Entry = {
    status: MixedSystem["status"];
    vital: boolean;
    from: Set<string>;
    scopes: Set<string>;
    whole: boolean;
  };
  const merged = new Map<string, Entry>();
  const add = (
    evaluation: Evaluation,
    division: string,
    only?: (id: string) => boolean,
    scope?: string,
  ) => {
    for (const system of evaluation.systems) {
      if (only && !only(system.id)) continue;
      const entry = merged.get(system.id) ?? {
        status: "not_required" as const,
        vital: false,
        from: new Set<string>(),
        scopes: new Set<string>(),
        whole: false,
      };
      entry.status = worse(entry.status, system.status);
      entry.vital ||= system.vital;
      if (system.status === "required") {
        entry.from.add(division);
        if (scope) entry.scopes.add(scope);
        else if (system.scopes.length === 0) entry.whole = true;
        else system.scopes.forEach((s) => entry.scopes.add(s));
      }
      merged.set(system.id, entry);
    }
  };

  const outcomes: MixedResult["parts"] = [];
  const analyses: string[] = [];
  const record = (
    part: OccupationPart,
    facts: Facts,
    evaluation: Evaluation,
  ) => {
    outcomes.push({ division: part.division, facts, evaluation });
    for (const a of evaluation.specificAnalyses) analyses.push(a.reason);
  };

  if (kind === "mixed") {
    for (const part of parts.filter((p) => p.separation === "isolated")) {
      // Art. 11, I: an isolated part stands alone.
      const facts = factsOf(part, part.area_m2, part.top_height_m);
      const evaluation = run(facts);
      record(part, facts, evaluation);
      add(evaluation, part.division);
    }
    for (const part of open) {
      // Art. 11, II and III: the areas add up; the height is the building's, or the part's when compartmented.
      const height = allCompartmented ? part.top_height_m : buildingHeight;
      const facts = factsOf(part, openArea, height);
      const evaluation = run(facts);
      record(part, facts, evaluation);
      // A compartmented part sizes some systems by itself, so the summed run does not decide them.
      const byItself = (id: string) =>
        part.separation === "compartmented" &&
        autonomous(id, part, singleStorey);
      add(evaluation, part.division, (id) => !byItself(id));
      if (part.separation === "compartmented") {
        const own = factsOf(part, part.area_m2, part.top_height_m);
        const ownEvaluation = run(own);
        add(ownEvaluation, part.division, byItself);
      }
    }
  } else {
    const [main, ...secondary] = parts;
    const facts = factsOf(main, openArea || main.area_m2, buildingHeight);
    const evaluation = run(facts);
    record(main, facts, evaluation);
    add(evaluation, main.division);
    for (const part of secondary) {
      // Art. 12: the secondary occupation adds its own systems, only in its own area.
      const own = factsOf(part, part.area_m2, part.top_height_m);
      const ownEvaluation = run(own);
      record(part, own, ownEvaluation);
      add(
        ownEvaluation,
        part.division,
        undefined,
        `somente na área da ocupação secundária ${part.division}`,
      );
    }
  }

  const needsVertical =
    merged.get("vertical_compartmentation")?.status === "required";
  const notes = [
    ...(needsVertical && open.length > 1 ? [NOTES.vertical] : []),
    NOTES.garage,
  ];
  return {
    systems: [...merged].map(([id, e]) => ({
      id,
      status: e.status,
      vital: e.vital,
      from: [...e.from],
      scopes: e.whole ? [] : [...e.scopes],
    })),
    analyses: [...new Set(analyses)],
    notes,
    parts: outcomes,
  };
}
