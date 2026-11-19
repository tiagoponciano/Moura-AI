"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { fetchNorms } from "../lib/client";
import type { AdminNormSource } from "../lib/types";

/** The norms the classification is built on, loaded once. */
export function useNorms() {
  const [norms, setNorms] = useState<AdminNormSource[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchNorms().then(
      (body) => setNorms(body.norms),
      (cause) => setError(errorMessage(cause)),
    );
  }, []);

  return { norms, error };
}
