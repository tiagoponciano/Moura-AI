import occupationsJson from "../../norms/in-1-p2/occupations.json";

/** One division of IN 1 parte 2, Tabela 1. */
export type Occupation = {
  group: string;
  /** The group's name, e.g. "Comercial". */
  occupation: string;
  division: string;
  /** e.g. "Comércio com baixa carga de incêndio". */
  description: string;
  /** What falls under it, as printed. */
  destination: string;
};

export const OCCUPATIONS: Occupation[] = (
  occupationsJson as { rows: Occupation[] }
).rows.map(({ group, occupation, division, description, destination }) => ({
  group,
  occupation,
  division,
  description,
  destination,
}));

export const OCCUPATION_BY_DIVISION = new Map(
  OCCUPATIONS.map((o) => [o.division, o]),
);

/** "C-2 · Comércio com média, alta ou altíssima carga de incêndio"; the id alone when unknown. */
export function divisionLabel(division: string): string {
  const occupation = OCCUPATION_BY_DIVISION.get(division);
  return occupation ? `${division} · ${occupation.description}` : division;
}

/** The name of the group of a division, e.g. "Comercial" for C-2. */
export function groupName(division: string): string | undefined {
  return OCCUPATION_BY_DIVISION.get(division)?.occupation;
}
