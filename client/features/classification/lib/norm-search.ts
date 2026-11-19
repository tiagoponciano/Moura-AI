/** One instruction's text, as `tools/norms/extract_articles.py` writes it. */
export type NormDoc = {
  doc: string;
  articles: { number: number; page: number; text: string }[];
};

/** A passage of a norm with where it comes from, for the assistant to cite. */
export type NormHit = {
  doc: string;
  article: number;
  page: number;
  /** The article text around the first match, at most `SNIPPET_LENGTH` characters. */
  excerpt: string;
  /** How many distinct words of the query the article has. */
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
export function queryWords(query: string): string[] {
  const words = normalize(query).match(/[a-z0-9]+/g) ?? [];
  return [
    ...new Set(words.filter((w) => w.length > 2 && !STOP_WORDS.has(w))),
  ].slice(0, MAX_QUERY_WORDS);
}

function excerpt(text: string, normalized: string, word: string): string {
  const at = Math.max(0, normalized.indexOf(word));
  const start = Math.max(0, at - 120);
  const piece = text.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? "…" : ""}${piece}${start + SNIPPET_LENGTH < text.length ? "…" : ""}`;
}

/**
 * The articles that best match the query: the ones with the most distinct words
 * of it, then the most occurrences. Nothing is returned when no word is searchable.
 */
export function searchArticles(
  docs: NormDoc[],
  query: string,
  limit = 5,
): NormHit[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const hits: (NormHit & { total: number })[] = [];
  for (const doc of docs) {
    for (const article of doc.articles) {
      const normalized = normalize(article.text);
      let matched = 0;
      let total = 0;
      let first: string | undefined;
      for (const word of words) {
        const count = normalized.split(word).length - 1;
        if (count > 0) {
          matched += 1;
          total += count;
          first ??= word;
        }
      }
      if (matched === 0 || !first) continue;
      hits.push({
        doc: doc.doc,
        article: article.number,
        page: article.page,
        excerpt: excerpt(article.text, normalized, first),
        matched,
        total,
      });
    }
  }
  hits.sort((a, b) => b.matched - a.matched || b.total - a.total);
  return hits.slice(0, limit).map(({ total: _total, ...hit }) => hit);
}
