/** Name of the LLM tool that records the answers to the key questions. */
export const RECORD_BUILDING_TOOL = "record_building";

export const OCCUPANCIES = [
  { id: "residential", label: "Residencial" },
  { id: "lodging", label: "Hospedagem" },
  { id: "commercial", label: "Comercial" },
  { id: "professional_services", label: "Serviços profissionais" },
  { id: "education", label: "Educacional" },
  { id: "public_assembly", label: "Reunião de público" },
  { id: "health", label: "Saúde" },
  { id: "industrial", label: "Industrial" },
  { id: "storage", label: "Depósito" },
] as const;

export type OccupancyId = (typeof OCCUPANCIES)[number]["id"];

export const OCCUPANCY_IDS = OCCUPANCIES.map((o) => o.id) as [
  OccupancyId,
  ...OccupancyId[],
];

/** The key questions; every answer is optional until the user gives it. */
export type Building = {
  areaM2?: number;
  heightM?: number;
  floorCount?: number;
  occupancy?: OccupancyId;
};

export type BuildingField = keyof Building;

export const BUILDING_FIELD_LABEL: Record<BuildingField, string> = {
  areaM2: "Área construída",
  heightM: "Altura",
  floorCount: "Pavimentos",
  occupancy: "Ocupação",
};

/** How many of the key questions have an answer. */
export function countAnswers(building: Building): number {
  return Object.values(building).filter((value) => value !== undefined).length;
}

export function occupancyLabel(id: OccupancyId): string {
  return OCCUPANCIES.find((o) => o.id === id)?.label ?? id;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Maps the `record_building` tool output (snake_case) to building answers,
 * keeping only valid values.
 */
export function pickBuildingAnswers(output: unknown): Building {
  if (!output || typeof output !== "object") return {};
  const raw = output as Record<string, unknown>;
  const answers: Building = {};
  if (isPositiveNumber(raw.area_m2)) answers.areaM2 = raw.area_m2;
  if (isPositiveNumber(raw.height_m)) answers.heightM = raw.height_m;
  if (isPositiveNumber(raw.floor_count) && Number.isInteger(raw.floor_count))
    answers.floorCount = raw.floor_count;
  if (OCCUPANCY_IDS.includes(raw.occupancy as OccupancyId))
    answers.occupancy = raw.occupancy as OccupancyId;
  return answers;
}
