"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { resolveFormLink, saveForms } from "../lib/client";
import {
  draftsToSave,
  toEditableDrafts,
  type EditableDraft,
} from "../lib/forms";

/** The link field, the drafts it produced and saving them. */
export function useFormImport(onSaved: () => Promise<void>) {
  const [url, setUrl] = useState("");
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<"resolving" | "saving">();
  const [notice, setNotice] = useState<string>();

  async function resolve() {
    setBusy("resolving");
    setError(undefined);
    setNotice(undefined);
    setProblems([]);
    try {
      setDrafts(toEditableDrafts((await resolveFormLink(url)).drafts));
    } catch (cause) {
      setDrafts([]);
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  function update(index: number, patch: Partial<EditableDraft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  async function save() {
    const { forms, problems: found } = draftsToSave(drafts);
    setProblems(found);
    if (found.length || !forms.length) return;
    setBusy("saving");
    setError(undefined);
    try {
      await saveForms(forms);
      await onSaved();
      setDrafts([]);
      setUrl("");
      setNotice(
        forms.length === 1
          ? "1 formulário salvo."
          : `${forms.length} formulários salvos.`,
      );
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  const selectedCount = drafts.filter((draft) => draft.selected).length;

  return {
    url,
    setUrl,
    drafts,
    update,
    resolve,
    save,
    selectedCount,
    problems,
    error,
    busy,
    notice,
  };
}
