"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { fetchForms, setFormActive } from "../lib/client";

/** The catalog as admins see it, inactive forms included. */
export function useAdminForms() {
  const [forms, setForms] = useState<CbmscForm[]>();
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  const reload = useCallback(async () => {
    try {
      setForms((await fetchForms()).forms);
      setError(undefined);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }, []);

  useEffect(() => {
    fetchForms().then(
      (body) => setForms(body.forms),
      (cause) => setError(errorMessage(cause)),
    );
  }, []);

  async function setActive(id: string, active: boolean) {
    setBusyId(id);
    try {
      await setFormActive(id, active);
      await reload();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId(undefined);
    }
  }

  return { forms, error, busyId, reload, setActive };
}
