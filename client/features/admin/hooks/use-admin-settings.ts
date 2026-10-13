"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage, fetchSettings } from "../lib/client";
import type { AdminSettingsResponse } from "../lib/types";

/** Settings and key hints; `run` saves something and reloads them. */
export function useAdminSettings() {
  const [data, setData] = useState<AdminSettingsResponse>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchSettings().then(setData, (cause) => setError(errorMessage(cause)));
  }, []);

  /** Runs `save`, then reloads; resolves to the error message, if any. */
  const run = useCallback(
    async (save: () => Promise<void>): Promise<string | undefined> => {
      try {
        await save();
        setData(await fetchSettings());
        return undefined;
      } catch (cause) {
        return errorMessage(cause);
      }
    },
    [],
  );

  return { data, error, run };
}
