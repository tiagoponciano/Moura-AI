import { HEIGHT_CLASSES } from "./rulesets/group-c-conditions";
import type { Facts } from "./engine/types";
/** The table by height of each covered division in IN 1 parte 2, Anexo B. */
const LARGE_TABLE: Record<string, number> = {
  "H-1": 15,
  "H-2": 15,
  "H-6": 15,
  "H-3": 16,
  "H-4": 17,
  "H-5": 17,
  "F-1": 8,
  "F-2": 8,
  "F-3": 9,
  "F-9": 9,
  "F-5": 10,
  "F-6": 10,
  "F-8": 10,
  "F-10": 10,
  "F-4": 11,
  "F-11": 12,
  "M-3": 25,
  "I-1": 18,
  "I-2": 18,
  "I-3": 19,
  "J-1": 20,
  "J-2": 20,
  "J-3": 21,
  "J-4": 21,
  "A-2": 3,
  "A-3": 3,
  "B-1": 4,
  "B-2": 4,
  "C-1": 5,
  "C-2": 5,
  "C-3": 5,
  "D-1": 6,
  "D-2": 6,
  "D-3": 6,
  "D-4": 6,
  "E-1": 7,
  "E-2": 7,
  "E-3": 7,
  "E-4": 7,
  "E-5": 7,
  "E-6": 7,
  "G-1": 13,
  "G-2": 13,
  "G-5": 13,
  "G-3": 14,
  "G-4": 14,
};

/** The column of the A-2 and A-3 grid of Tabela 3, which splits at 6, 15 and 30 m. */
function tableThreeColumn(facts: Facts): string | undefined {
  if (facts.storeys === 1) return "Térrea";
  const h = facts.height_m;
  if (typeof h !== "number") return undefined;
  if (h <= 6) return "H ≤ 6";
  if (h <= 15) return "6 < H ≤ 15";
  if (h <= 30) return "15 < H ≤ 30";
  return "> 30";
}

/** The column of Tabela 22 (Grupo K), which is not split by area or height. */
function tableTwentyTwoColumn(facts: Facts): string | undefined {
  if (facts.division === "K-1") {
    const volume = facts.combustible_liquid_m3;
    if (typeof volume !== "number") return undefined;
    return volume <= 20 ? "K-1, ≤ 20 m³" : "K-1, > 20 m³";
  }
  if (facts.power_plant_type === "hydro") return "K-2, hidroelétrica";
  if (facts.power_plant_type === "thermal") return "K-2, termoelétrica";
  return undefined;
}

/** Divisions whose table does not depend on area or height. */
const NO_REGIME_TABLE: Record<string, number> = {
  "M-4": 26,
  "M-7": 26,
  "M-5": 27,
  "M-6": 28,
  "M-11": 29,
};

const A1_COLUMNS: Record<string, string> = {
  attached: "geminada/conjugada",
  detached: "isolada",
  mixed_single_family: "unifamiliar mista",
};

const M2_COLUMNS: Record<string, string> = {
  tanks_processes: "tanques, cilindros e processos",
  loading_platform: "plataforma de carregamento",
  packaged_products: "produtos acondicionados",
};

export function tableHint(facts: Facts): string | undefined {
  if (facts.division === "M-1") return "Tabela 23 (túnel)";
  if (facts.division === "A-1") {
    const column = A1_COLUMNS[String(facts.a1_construction)];
    return column ? `Tabela 3 (A-1), coluna ${column}` : "Tabela 3 (A-1)";
  }
  const noRegime = NO_REGIME_TABLE[String(facts.division)];
  if (noRegime) return `Tabela ${noRegime}`;
  if (facts.division === "M-2") {
    const column = M2_COLUMNS[String(facts.m2_installation)];
    return column ? `Tabela 24, coluna ${column}` : "Tabela 24";
  }
  if (facts.division === "K-1" || facts.division === "K-2") {
    const column = tableTwentyTwoColumn(facts);
    return column ? `Tabela 22, coluna ${column}` : "Tabela 22";
  }
  if (facts.regime === "small") return "Tabela 2 (imóvel até 750 m² e 12 m)";
  if (facts.regime !== "large") return undefined;
  const table = LARGE_TABLE[String(facts.division)];
  const label = table ? `Tabela ${table}` : "Tabela por altura";
  const column = HEIGHT_CLASSES.find((h) => h.id === facts.height_class);
  // Tabelas 3 and 4 split the heights differently from the others.
  const name =
    table === 4 &&
    (facts.height_class === "h12_23" || facts.height_class === "h23_30")
      ? "12 < H ≤ 30"
      : table === 3
        ? tableThreeColumn(facts)
        : column?.label;
  return name ? `${label}, coluna ${name}` : label;
}
