"use client";

import { useEffect, useState } from "react";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { errorMessage } from "@/lib/api/request-json";
import { fetchCbmscForms } from "../lib/cbmsc-forms";

/** The CBMSC form catalog; loads when mounted. */
export function useCbmscForms() {
  const [forms, setForms] = useState<CbmscForm[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchCbmscForms().then(
      (body) => setForms(body.forms),
      (cause) => setError(errorMessage(cause)),
    );
  }, []);

  return { forms: forms ?? [], loading: !forms && !error, error };
}
