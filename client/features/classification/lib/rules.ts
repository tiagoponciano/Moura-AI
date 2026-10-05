import type { OccupancyId } from "./building";

/**
 * All criteria of a condition must hold. Thresholds are exclusive
 * ("greater than"), in m² and meters.
 */
export type Condition = {
  minAreaM2?: number;
  minHeightM?: number;
  minFloorCount?: number;
  occupancies?: OccupancyId[];
};

export type SystemRule = {
  id: string;
  system: string;
  /** Second layer: what to check for this system in design and inspection. */
  checks: string[];
  /** Required when any condition holds; an empty list means always required. */
  when: Condition[];
};

/**
 * PROVISIONAL rule set for demonstration only. Thresholds are placeholders,
 * not taken from the CBMSC Instruções Normativas, and must be replaced by the
 * criteria Moura provides (IN 1 classification tables) before real use.
 */
export const PROVISIONAL_RULES: SystemRule[] = [
  {
    id: "extinguishers",
    system: "Extintores de incêndio",
    checks: [
      "Quantidade e distribuição por pavimento",
      "Distância máxima até o extintor a partir da entrada",
      "Sinalização e acesso desobstruído",
    ],
    when: [],
  },
  {
    id: "emergency_signage",
    system: "Sinalização de emergência",
    checks: [
      "Placas de rota de fuga e saída",
      "Sinalização dos equipamentos de combate",
    ],
    when: [],
  },
  {
    id: "emergency_exits",
    system: "Saídas de emergência",
    checks: [
      "Largura e quantidade de saídas",
      "Distância máxima a percorrer",
      "Portas com abertura no sentido da fuga",
    ],
    when: [],
  },
  {
    id: "emergency_lighting",
    system: "Iluminação de emergência",
    checks: ["Pontos de luz nas rotas de fuga", "Autonomia das luminárias"],
    when: [
      { minAreaM2: 750 },
      { minFloorCount: 2 },
      { occupancies: ["public_assembly"] },
    ],
  },
  {
    id: "fire_alarm",
    system: "Alarme de incêndio",
    checks: [
      "Acionadores manuais por pavimento",
      "Avisadores sonoros e visuais",
      "Central de alarme",
    ],
    when: [
      { minAreaM2: 1500 },
      { minHeightM: 12 },
      {
        occupancies: ["public_assembly", "lodging", "health", "education"],
        minAreaM2: 750,
      },
    ],
  },
  {
    id: "hydrants",
    system: "Hidrantes e mangotinhos",
    checks: [
      "Reserva técnica de incêndio",
      "Posição dos abrigos e alcance das mangueiras",
      "Bomba de incêndio",
    ],
    when: [{ minAreaM2: 750 }, { minHeightM: 12 }],
  },
  {
    id: "lightning_protection",
    system: "SPDA (proteção contra descargas atmosféricas)",
    checks: ["Captação, descidas e aterramento", "Laudo de medição"],
    when: [{ minAreaM2: 1500 }, { minHeightM: 12 }],
  },
  {
    id: "sprinklers",
    system: "Chuveiros automáticos (sprinklers)",
    checks: [
      "Classificação de risco da área protegida",
      "Reserva e bombas dedicadas",
    ],
    when: [
      { minHeightM: 30 },
      { occupancies: ["storage", "industrial", "commercial"], minAreaM2: 5000 },
    ],
  },
];
