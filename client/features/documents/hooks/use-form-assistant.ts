"use client";

import { useEffect, useState } from "react";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { assistantState, fetchFormVersion } from "../lib/cbmsc-forms";
import type { TemplateEntry } from "../lib/templates";

/** Compares a form's tagged copy to the live Google Doc once, when it opens. */
export function useFormAssistant(form: CbmscForm, template?: TemplateEntry) {
  const [currentHash, setCurrentHash] = useState<string | null>();
  const hasTemplate = template !== undefined;

  useEffect(() => {
    if (!hasTemplate) return;
    fetchFormVersion(form.googleDocId).then(
      (body) => setCurrentHash(body.textHash),
      () => setCurrentHash(null),
    );
  }, [form.googleDocId, hasTemplate]);

  return assistantState(template, currentHash);
}
