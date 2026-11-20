/** One instruction's text, as `tools/norms/extract_articles.py` writes it. */
export type NormDoc = {
  doc: string;
  articles: { number: number; page: number; text: string }[];
  /** The pages from the first annex on, as raw text (tables and figures are not parsed). */
  annexes?: { page: number; title: string; text: string }[];
};

/** A passage of a norm with where it comes from, for the assistant to cite. */
export type NormHit = {
  doc: string;
  /** An article of the instruction, or a page of its annexes. */
  kind: "article" | "annex";
  /** The article number; absent for an annex page. */
  article?: number;
  page: number;
  /** The text around the first match, at most `SNIPPET_LENGTH` characters. */
  excerpt: string;
  /** How many distinct words of the query the text has. */
  matched: number;
};

export const SNIPPET_LENGTH = 700;
const MAX_QUERY_WORDS = 8;
const STOP_WORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "que",
  "um",
  "uma",
  "ou",
  "se",
  "ao",
]);

/** Lowercase without accents, so `"iluminação"` finds `"ILUMINACAO"`. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** The words of a query worth searching for, without short and filler words. */
export function queryWords(query: string, max = MAX_QUERY_WORDS): string[] {
  const words = normalize(query).match(/[a-z0-9]+/g) ?? [];
  return [
    ...new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w))),
  ].slice(0, max);
}

function excerpt(text: string, normalized: string, word: string): string {
  const at = Math.max(0, normalized.indexOf(word));
  const start = Math.max(0, at - 120);
  const piece = text.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? "…" : ""}${piece}${start + SNIPPET_LENGTH < text.length ? "…" : ""}`;
}

/** The most synonyms and related words one search takes in. */
const MAX_ALSO_WORDS = 12;

/**
 * The articles and annex pages that best match the query: the ones with the most
 * distinct words of it, then the most occurrences. `also` holds synonyms and other
 * words the norm may use for the same idea (the assistant knows them, the text may
 * not use the user's word): each counts, but half as much as a word of the query
 * itself. Nothing is returned when no word is searchable.
 */
export function searchArticles(
  docs: NormDoc[],
  query: string,
  limit = 5,
  also: string[] = [],
): NormHit[] {
  const words = queryWords(query);
  const alsoWords = queryWords(also.join(" "), MAX_ALSO_WORDS).filter(
    (word) => !words.includes(word),
  );
  if (words.length === 0 && alsoWords.length === 0) return [];
  const hits: (NormHit & { total: number; score: number })[] = [];
  const consider = (
    doc: string,
    kind: NormHit["kind"],
    article: number | undefined,
    page: number,
    text: string,
  ) => {
    const normalized = normalize(text);
    let matched = 0;
    let total = 0;
    let first: string | undefined;
    const count = (word: string) => {
      const found = normalized.split(word).length - 1;
      if (found > 0) {
        total += found;
        first ??= word;
      }
      return found > 0 ? 1 : 0;
    };
    const primary = words.reduce((sum, word) => sum + count(word), 0);
    const related = alsoWords.reduce((sum, word) => sum + count(word), 0);
    matched = primary + related;
    if (matched === 0 || !first) return;
    hits.push({
      doc,
      kind,
      article,
      page,
      excerpt: excerpt(text, normalized, first),
      matched,
      total,
      score: primary * 2 + related,
    });
  };
  for (const doc of docs) {
    for (const article of doc.articles) {
      consider(doc.doc, "article", article.number, article.page, article.text);
    }
    for (const annex of doc.annexes ?? []) {
      consider(doc.doc, "annex", undefined, annex.page, annex.text);
    }
  }
  hits.sort((a, b) => b.score - a.score || b.total - a.total);
  return hits
    .slice(0, limit)
    .map(({ doc, kind, article, page, excerpt, matched }) => ({
      doc,
      kind,
      article,
      page,
      excerpt,
      matched,
    }));
}
