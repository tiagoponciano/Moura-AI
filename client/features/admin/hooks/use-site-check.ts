"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { SiteCheck } from "@/lib/cbmsc-forms/types";
import { fetchSiteCheck, runSiteCheck } from "../lib/client";

/** The latest reading of the CBMSC site; `run` is "Verificar agora". */
export function useSiteCheck() {
  const [check, setCheck] = useState<SiteCheck | null>();
  const [error, setError] = useState<string>();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetchSiteCheck().then(
      (body) => setCheck(body.check),
      (cause) => setError(errorMessage(cause)),
    );
  }, []);

  async function run() {
    setRunning(true);
    setError(undefined);
    try {
      setCheck((await runSiteCheck()).check);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setRunning(false);
    }
  }

  return { check, error, running, run };
}
