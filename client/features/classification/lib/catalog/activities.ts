import annexA from "../../norms/in-3/annex-a.json";

/** One line of IN 3, Annex A: what a building is used for and its specific fire load. */
export type Activity = {
  id: string;
  group: string;
  division: string;
  destination: string;
  /** Specific fire load in MJ/m²; absent when the norm points to another annex. */
  qfi?: number;
  /** What the load column says instead of a number, e.g. "Anexo C". */
  qfiRef?: string;
  page: number;
};

type Row = {
  group: string;
  division: string;
  destination: string;
  qfi_mj_m2: number | null;
  qfi_raw: string;
  page: number;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(text: string): string {
  return normalize(text).replace(/ /g, "-").slice(0, 48).replace(/-$/, "");
}

/** The activities of Annex A, one per division and destination, with a stable id. */
export const ACTIVITIES: Activity[] = (() => {
  const seen = new Set<string>();
  const activities: Activity[] = [];
  for (const row of (annexA as { rows: Row[] }).rows) {
    const id = `${row.division}-${slug(row.destination)}`;
    // The norm prints "I-2 Estaleiros" twice with the same load.
    if (seen.has(id)) continue;
    seen.add(id);
    activities.push({
      id,
      group: row.group,
      division: row.division,
      destination: row.destination,
      ...(row.qfi_mj_m2 === null
        ? { qfiRef: row.qfi_raw }
        : { qfi: row.qfi_mj_m2 }),
      page: row.page,
    });
  }
  return activities;
})();

export const ACTIVITY_BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]));

const divisionOrder = (division: string) => {
  const [group, n] = division.split("-");
  return group.charCodeAt(0) * 100 + Number(n);
};

/** Every division that has an activity, in group and number order. */
export const DIVISIONS = [...new Set(ACTIVITIES.map((a) => a.division))].sort(
  (a, b) => divisionOrder(a) - divisionOrder(b),
);

const STOP = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "com",
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "no",
  "na",
  "nos",
  "nas",
  "venda",
  "vendas",
]);

/** Words that say the building sells (Grupo C) or makes (Grupo I); they order the matches. */
const COMMERCE = new Set([
  "loja",
  "boutique",
  "comercio",
  "varejo",
  "revenda",
  "vende",
]);
const INDUSTRY = new Set([
  "fabrica",
  "industria",
  "producao",
  "fabricacao",
  "confeccao",
]);

/**
 * Words people use for what the norm calls something else. A search aid only:
 * the user always confirms the activity that is recorded.
 */
const SYNONYMS: Record<string, string[]> = {
  roupa: ["vestuario"],
  moda: ["vestuario"],
  camisa: ["vestuario"],
  camiseta: ["vestuario"],
  vestido: ["vestuario"],
  sapato: ["calcado"],
  tenis: ["calcado"],
  farmacia: ["drogaria"],
  mercado: ["supermercado"],
  mercadinho: ["supermercado"],
  hipermercado: ["supermercado"],
  pet: ["animal"],
  livro: ["livraria"],
  brinquedo: ["brinquedo"],
};

function singular(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("eis")) return `${token.slice(0, -3)}el`;
  if (token.endsWith("ais")) return `${token.slice(0, -3)}al`;
  return token.endsWith("s") ? token.slice(0, -1) : token;
}

const tokens = (text: string) =>
  normalize(text)
    .split(" ")
    .filter((t) => t && !STOP.has(t))
    .map(singular);

const TOKENS_BY_ID = new Map(
  ACTIVITIES.map((a) => [a.id, new Set(tokens(a.destination))]),
);

export type ActivityMatch = { activity: Activity; score: number };

/**
 * Activities whose destination matches the words of a description, best first.
 * Nothing is returned for a description the annex does not list; the norm then
 * leaves the load to similarity (IN 3, art. 6º, § 1º), which is for a person.
 */
export function searchActivities(query: string, limit = 5): ActivityMatch[] {
  const words = tokens(query);
  const commerce = words.some((w) => COMMERCE.has(w));
  const industry = words.some((w) => INDUSTRY.has(w));
  const terms = words.filter((w) => !COMMERCE.has(w) && !INDUSTRY.has(w));
  if (terms.length === 0) return [];

  return ACTIVITIES.map((activity) => {
    const own = TOKENS_BY_ID.get(activity.id)!;
    const matched = terms.filter((term) =>
      [term, ...(SYNONYMS[term] ?? [])].some((alt) => own.has(alt)),
    ).length;
    let score = matched / terms.length;
    if (matched > 0) {
      if (commerce && activity.group === "C") score += 0.2;
      if (industry && activity.group === "I") score += 0.2;
      score -= own.size * 0.001;
    }
    return { activity, score, matched };
  })
    .filter((m) => m.matched > 0 && m.matched / terms.length >= 0.5)
    .sort(
      (a, b) => b.score - a.score || a.activity.id.localeCompare(b.activity.id),
    )
    .slice(0, limit)
    .map(({ activity, score }) => ({ activity, score }));
}

export const activityLabel = (activity: Activity) =>
  `${activity.division} · ${activity.destination}`;
