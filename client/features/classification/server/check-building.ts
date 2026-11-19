import { tool } from "ai";
import { z } from "zod";
import { classify } from "../lib/classify";
import type { Facts } from "../lib/engine/types";
import { FIRE_LOAD_CLASSES } from "../lib/rulesets/group-c-conditions";
import { analysisDate } from "../lib/today";

/** Name of the LLM tool the other assistants call to check building data against the norms. */
export const CHECK_BUILDING_TOOL = "check_building";

const RISKS = ["I", "II", "III", "IV", "V"] as const;

/** Input of the `check_building` tool: what a person may state about a building. */
export const checkBuildingInput = z.object({
  division: z
    .string()
    .regex(/^[A-M]-\d{1,2}$/)
    .optional()
    .describe("Occupation division of the building, like C-2"),
  area_m2: z
    .number()
    .positive()
    .optional()
    .describe("Built area in square meters"),
  height_m: z.number().min(0).optional().describe("Building height in meters"),
  storeys: z.number().int().min(1).optional().describe("Number of storeys"),
  capacity_people: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("People the place holds"),
  fire_load_class: z
    .enum(FIRE_LOAD_CLASSES.map((c) => c.id) as [string, ...string[]])
    .optional()
    .describe("Fire load class: negligible, low, medium, high or very_high"),
  glp_kg: z
    .number()
    .min(0)
    .optional()
    .describe("LPG stored or used, in kilograms"),
  special_risks: z
    .boolean()
    .optional()
    .describe(
      "True when the place has LPG, flammable or combustible liquids or hazardous substances beyond everyday use; false otherwise",
    ),
  risk_exempt: z
    .boolean()
    .optional()
    .describe(
      "True when the activity is one of the risk I exemptions: no establishment, street vendor, single-family home up to 200 square meters with at most one employee, family farming, small horizontal condominium or coworking",
    ),
  declared_risk: z
    .enum(RISKS)
    .optional()
    .describe(
      "The risk level I to V the user says the property has, to be checked",
    ),
});
export type CheckBuildingInput = z.infer<typeof checkBuildingInput>;

export type CheckBuildingResult = {
  /** `decided` when the rules settle the risk; `pending` when answers are missing; `not_covered` outside the rules. */
  status: "decided" | "pending" | "not_covered";
  risk?: string;
  process?: string;
  /** Where the decision comes from, for the assistant to cite. */
  source?: string;
  /** What still has to be asked before the risk can be settled. */
  missing: string[];
  /** Where what the user declared differs from what the norm gives. */
  conflicts: string[];
};

/** Runs the classification rules over the stated data. It decides nothing the rules do not. */
export function checkBuilding(
  input: CheckBuildingInput,
  date: string = analysisDate(),
): CheckBuildingResult {
  const { declared_risk, ...stated } = input;
  const facts: Facts = Object.fromEntries(
    Object.entries(stated).filter(([, value]) => value !== undefined),
  );
  const result = classify(facts, date);
  const missing = result.nextQuestions.map((question) => question.label);
  const conflicts: string[] = [...result.conflicts];

  if (!result.risk || result.risk.status === "not_covered") {
    return { status: "not_covered", missing, conflicts };
  }
  if (result.risk.status === "pending") {
    return { status: "pending", missing, conflicts };
  }
  const { level, process, reason } = result.risk;
  if (declared_risk && declared_risk !== level) {
    conflicts.push(
      `Informado risco ${declared_risk}, mas pela norma o risco é ${level}.`,
    );
  }
  return {
    status: "decided",
    risk: level,
    process,
    source: reason.locator,
    missing,
    conflicts,
  };
}

/** The tool set the documents route adds to its assistant. */
export const buildingCheckTools = {
  [CHECK_BUILDING_TOOL]: tool({
    description:
      "Checks building data the user states against the fire safety norms and returns the risk level, the process and what is missing. Call it whenever the user gives the occupation, area, height, storeys, people or the risk of the building. If conflicts come back, tell the user and ask before recording the conflicting value.",
    inputSchema: checkBuildingInput,
    execute: async (input) => checkBuilding(input),
  }),
};
