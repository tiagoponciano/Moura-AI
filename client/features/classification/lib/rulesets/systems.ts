/** Canonical ids of the fire protection systems and their on-screen names (Portuguese). */
export const SYSTEMS = {
  vehicle_access: "Acesso de viaturas",
  fire_alarm: "Alarme de incêndio",
  fire_brigade: "Brigada de incêndio",
  sprinklers: "Chuveiros automáticos",
  horizontal_compartmentation: "Compartimentação horizontal ou de áreas",
  vertical_compartmentation: "Compartimentação vertical",
  smoke_control: "Controle de fumaça",
  finishing_materials_control: "Controle de materiais de acabamento",
  automatic_detection: "Detecção automática de incêndio",
  emergency_elevator: "Elevador de emergência",
  extinguishers: "Extintores",
  combustible_gas: "Gás combustível",
  hydraulic_preventive: "Hidráulico preventivo",
  emergency_lighting: "Iluminação de emergência",
  low_voltage_installations: "Instalações elétricas de baixa tensão",
  emergency_plan: "Plano de emergência",
  structural_protection: "Proteção estrutural (TRRF)",
  emergency_exits: "Saídas de emergência",
  emergency_signage: "Sinalização para abandono de local",
} as const;

export type SystemId = keyof typeof SYSTEMS;

/** The same system is labelled differently from table to table. Keys are lower case. */
const ALIASES: Record<string, SystemId> = {
  "acesso de viaturas na edificação": "vehicle_access",
  "alarme de incêndio": "fire_alarm",
  "brigada de incêndio": "fire_brigade",
  "chuveiros automáticos": "sprinklers",
  "compartimentação horizontal ou de áreas": "horizontal_compartmentation",
  "compartimentação vertical": "vertical_compartmentation",
  "controle de fumaça": "smoke_control",
  "controle de materiais de acabamento": "finishing_materials_control",
  "detecção automática de incêndio": "automatic_detection",
  "elevador de emergência": "emergency_elevator",
  extintores: "extinguishers",
  "gás combustível": "combustible_gas",
  "hidráulico preventivo": "hydraulic_preventive",
  "iluminação de emergência": "emergency_lighting",
  "instalação elétrica de baixa tensão": "low_voltage_installations",
  "instalações elétricas de baixa voltagem": "low_voltage_installations",
  "plano de emergência": "emergency_plan",
  "proteção estrutural (trrf)": "structural_protection",
  "saídas de emergência": "emergency_exits",
  "sinalização para abandono de local": "emergency_signage",
};

/** The canonical id for a table row label; throws on a label nobody reviewed, so a typo cannot drop a system. */
export function systemIdFromLabel(label: string): SystemId {
  const id = ALIASES[label.replace(/\s+/g, " ").trim().toLowerCase()];
  if (!id) throw new Error(`Unknown system label: "${label}"`);
  return id;
}

export function systemLabel(id: string): string {
  return id in SYSTEMS ? SYSTEMS[id as SystemId] : id;
}
