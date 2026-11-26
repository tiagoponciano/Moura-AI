"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { fetchProposalTemplate } from "../lib/client";
import type { ProposalTemplateInfo } from "../lib/types";

/** The proposal deck in use; `run` saves something and reloads it. */
export function useProposalTemplate() {
  const [info, setInfo] = useState<ProposalTemplateInfo>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchProposalTemplate().then(setInfo, (cause) =>
      setError(errorMessage(cause)),
    );
  }, []);

  /** Runs `save`, then reloads; resolves to the error message, if any. */
  const run = useCallback(
    async (save: () => Promise<void>): Promise<string | undefined> => {
      try {
        await save();
        setInfo(await fetchProposalTemplate());
        return undefined;
      } catch (cause) {
        return errorMessage(cause);
      }
    },
    [],
  );

  return { info, error, run };
}
