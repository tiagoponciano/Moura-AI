"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { fetchNormHits } from "../lib/norm-client";
import type { NormHit } from "../lib/norm-search";

/** A search over one instruction's articles; the result of the last search stays on screen. */
export function useNormSearch(doc: string) {
  const [hits, setHits] = useState<NormHit[]>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function search(query: string) {
    setBusy(true);
    setError(undefined);
    try {
      const found = await fetchNormHits(query, doc);
      setHits(found.hits);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return { hits, error, busy, search };
}
