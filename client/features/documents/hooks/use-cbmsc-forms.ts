"use client";

import { useEffect, useMemo, useState } from "react";
import { groupByNormative } from "@/lib/cbmsc-forms/catalog";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { errorMessage } from "@/lib/api/request-json";
import { fetchCbmscForms, filterForms } from "../lib/cbmsc-forms";

/** Catalog, search and selection of the CBMSC forms dialog; loads when mounted. */
export function useCbmscForms() {
  const [forms, setForms] = useState<CbmscForm[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();

  useEffect(() => {
    fetchCbmscForms().then(
      (body) => setForms(body.forms),
      (cause) => setError(errorMessage(cause)),
    );
  }, []);

  const groups = useMemo(
    () => groupByNormative(filterForms(forms ?? [], query)),
    [forms, query],
  );
  const selected = forms?.find((form) => form.googleDocId === selectedId);

  return {
    loading: !forms && !error,
    error,
    query,
    setQuery,
    groups,
    selected,
    select: setSelectedId,
    clearSelection: () => setSelectedId(undefined),
  };
}
