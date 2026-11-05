"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { fetchForms, saveForms, updateForm } from "../lib/client";
import type { SiteDifference } from "../lib/site-check";
import type { FormChange } from "../lib/validation";

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

  /** Runs a change on one row and reloads; `false` when it failed and `error` says why. */
  async function changeRow(id: string, change: () => Promise<void>) {
    setBusyId(id);
    try {
      await change();
      await reload();
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBusyId(undefined);
    }
  }

  const update = (id: string, change: FormChange) =>
    changeRow(id, () => updateForm(id, change));

  /** Does what a site check warning offers. */
  function applyDifference(difference: SiteDifference) {
    switch (difference.kind) {
      case "link_changed":
        return update(difference.form.googleDocId, {
          googleDocId: difference.site.googleDocId,
        });
      case "details_changed": {
        const { normative, annex, name } = difference.site;
        return update(difference.form.googleDocId, {
          name,
          ...(normative !== null && { normative }),
          ...(annex !== null && { annex }),
        });
      }
      case "removed":
        return update(difference.form.googleDocId, { active: false });
      case "new": {
        const { googleDocId, normative, annex, name } = difference.site;
        if (normative === null || annex === null) return Promise.resolve(false);
        return changeRow(googleDocId, () =>
          saveForms([{ googleDocId, normative, annex, name }]),
        );
      }
    }
  }

  return { forms, error, busyId, reload, update, applyDifference };
}
