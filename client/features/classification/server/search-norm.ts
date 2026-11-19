import { tool } from "ai";
import { z } from "zod";
import { NORM_TEXT_LOADERS } from "../lib/norm-text-loaders";
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

const key = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Searches the article text of the CBMSC instructions, all of them or the one named (`IN 7`, `IN-1-P2`). */
export async function searchNorm(
  query: string,
  doc?: string,
  limit = 5,
): Promise<{ hits: NormHit[]; note?: string }> {
  const wanted = doc ? key(doc) : undefined;
  const codes = Object.keys(NORM_TEXT_LOADERS).filter(
    (code) => !wanted || key(code) === wanted,
  );
  if (codes.length === 0) {
    return { hits: [], note: `No instruction named ${doc}.` };
  }
  const docs = await Promise.all(codes.map(loadDoc));
  const hits = searchArticles(docs, query, limit);
  return {
    hits,
    note: hits.length === 0 ? "No article matches those words." : undefined,
  };
}

const searchNormInput = z.object({
  query: z
    .string()
    .min(3)
    .max(200)
    .describe(
      "Words to look for in the norm text, in Portuguese, like: distancia maxima extintor",
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
export const normSearchTools = {
  [SEARCH_NORM_TOOL]: tool({
    description:
      "Searches the text of the CBMSC fire safety instructions (INs) and returns the matching articles with the instruction, article number and page. Call it before stating what a norm requires, and cite the instruction and article it returns. If nothing matches, say so; never answer a norm question from memory.",
    inputSchema: searchNormInput,
    execute: async ({ query, doc }) => searchNorm(query, doc),
  }),
};
