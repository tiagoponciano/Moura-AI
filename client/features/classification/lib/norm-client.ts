import { requestJson } from "@/lib/api/request-json";
import type { NormHit } from "./norm-search";

/** The articles of the instruction that best match the words; `doc` is `IN-7` or `IN 7`. */
export const fetchNormHits = (query: string, doc: string) =>
  requestJson<{ hits: NormHit[]; note?: string }>(
    `/api/classification/norm?q=${encodeURIComponent(query)}&doc=${encodeURIComponent(doc)}`,
  );
