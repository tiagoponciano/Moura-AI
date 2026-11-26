import { tool } from "ai";
import { z } from "zod";
import { pageTablesMarkdown, type AnnexTables } from "../lib/annex-tables";
import {
  NORM_TABLE_LOADERS,
  NORM_TEXT_LOADERS,
} from "../lib/norm-text-loaders";
import { searchArticles, type NormDoc, type NormHit } from "../lib/norm-search";

/** Name of the LLM tool the assistants call to read what a norm says. */
export const SEARCH_NORM_TOOL = "search_norm";

const cache = new Map<string, Promise<NormDoc>>();

/** One instruction's text, loaded the first time it is asked for. */
function loadDoc(doc: string): Promise<NormDoc> {
  let loaded = cache.get(doc);
  if (!loaded) {
    loaded = NORM_TEXT_LOADERS[doc]().then(
      (module) =>
        ((module as { default?: NormDoc }).default ?? module) as NormDoc,
    );
    cache.set(doc, loaded);
  }
  return loaded;
}

/** The annex tables of one instruction, or none when they were not extracted. */
async function loadTables(code: string): Promise<AnnexTables | undefined> {
  const load = NORM_TABLE_LOADERS[code];
  if (!load) return undefined;
  const loaded = await load();
  return ((loaded as { default?: AnnexTables }).default ??
    loaded) as AnnexTables;
}

const key = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Searches the article text of the CBMSC instructions, all of them or the one named (`IN 7`, `IN-1-P2`). */
export async function searchNorm(
  query: string,
  doc?: string,
  limit = 5,
  also: string[] = [],
): Promise<{ hits: NormHit[]; note?: string }> {
  const wanted = doc ? key(doc) : undefined;
  const codes = Object.keys(NORM_TEXT_LOADERS).filter(
    (code) => !wanted || key(code) === wanted,
  );
  if (codes.length === 0) {
    return { hits: [], note: `No instruction named ${doc}.` };
  }
  const docs = await Promise.all(codes.map(loadDoc));
  const hits = searchArticles(docs, query, limit, also);
  return {
    hits,
    note: hits.length === 0 ? "No article matches those words." : undefined,
  };
}

/** The most of an article or an annex page handed back in one reading. */
const READ_LIMIT = 8000;

export type NormReading =
  | {
      doc: string;
      kind: "article" | "annex";
      article?: number;
      page: number;
      text: string;
      /** True when the text was cut at the reading limit. */
      truncated: boolean;
    }
  | { note: string };

/** The whole text of an article (`article`) or of an annex page (`annexPage`) of one instruction. */
export async function readNormText(
  doc: string,
  at: { article?: number; annexPage?: number },
): Promise<NormReading> {
  const code = Object.keys(NORM_TEXT_LOADERS).find((c) => key(c) === key(doc));
  if (!code) return { note: `No instruction named ${doc}.` };
  const loaded = await loadDoc(code);
  const found =
    at.article !== undefined
      ? loaded.articles.find((a) => a.number === at.article)
      : loaded.annexes?.find((a) => a.page === at.annexPage);
  if (!found) {
    return {
      note:
        at.article !== undefined
          ? `${code} has no article ${at.article}.`
          : `${code} has no annex on page ${at.annexPage}.`,
    };
  }
  // An annex page with tables is read table first, as a grid, then its text.
  const tables =
    at.article === undefined
      ? pageTablesMarkdown(
          (await loadTables(code)) ?? { pages: [] },
          found.page,
        )
      : "";
  const text = tables
    ? `Tabelas desta página, lidas da grade do PDF:\n\n${tables}\n\nTexto da página, como impresso:\n\n${found.text}`
    : found.text;
  return {
    doc: code,
    kind: at.article !== undefined ? "article" : "annex",
    article: at.article,
    page: found.page,
    text: text.slice(0, READ_LIMIT),
    truncated: text.length > READ_LIMIT,
  };
}

const readNormInput = z
  .object({
    doc: z.string().max(20).describe("The instruction, like IN 7 or IN-1-P2"),
    article: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("The article number to read, like 12"),
    annex_page: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("The page of an annex to read, as search_norm returned it"),
  })
  .refine((v) => (v.article === undefined) !== (v.annex_page === undefined), {
    message: "Send either article or annex_page, not both and not neither",
  });

const searchNormInput = z.object({
  query: z
    .string()
    .min(3)
    .max(200)
    .describe(
      "Words to look for in the norm text, in Portuguese, like: distancia maxima extintor",
    ),
  also: z
    .array(z.string().min(2).max(60))
    .max(6)
    .optional()
    .describe(
      "Synonyms and other words or short phrases the norm may use for the same idea, in Portuguese, like: escada a prova de fumaca, PF. The norm text may not use the user's own word; these count too",
    ),
  doc: z
    .string()
    .max(20)
    .optional()
    .describe(
      "Optional instruction to search only, like IN 7 or IN-1-P2. Leave it out to search all of them",
    ),
});

/** The tool set that lets an assistant read the norms instead of answering from memory. */
export const READ_NORM_TOOL = "read_norm_text";

export const normSearchTools = {
  [SEARCH_NORM_TOOL]: tool({
    description:
      "Searches the text of the CBMSC fire safety instructions (INs) and returns the matching articles and annex pages, each with the instruction, the article number (not for an annex) and the page, and an excerpt. Call it before stating what a norm requires, and cite the instruction and article it returns. The text may not use the user's word: put synonyms and related terms in `also`, and search again with other words when little is found. To read a whole article or annex page found, call read_norm_text. If nothing matches, say so; never answer a norm question from memory.",
    inputSchema: searchNormInput,
    execute: async ({ query, doc, also }) => searchNorm(query, doc, 5, also),
  }),
  [READ_NORM_TOOL]: tool({
    description:
      "Reads the whole text of one article, or of one annex page, of a CBMSC instruction, as printed. Use it after search_norm when the excerpt is not enough, with the instruction and the article number or the annex page it returned. An annex page of IN 7, IN 8 or IN 9 comes with its tables as a grid, read from the PDF, before its text; other annex pages are raw text and tables may lose their layout.",
    inputSchema: readNormInput,
    execute: async ({ doc, article, annex_page }) =>
      readNormText(doc, { article, annexPage: annex_page }),
  }),
};
