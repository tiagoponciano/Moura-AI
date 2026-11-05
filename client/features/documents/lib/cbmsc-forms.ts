import { requestJson } from "@/lib/api/request-json";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import type { TemplateEntry } from "./templates";

export const fetchCbmscForms = () =>
  requestJson<{ forms: CbmscForm[] }>("/api/documents/forms");

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Forms whose "IN n Anexo X name" contains every word of `query`, ignoring
 * accents and case. Words match as substrings, so "in 1" also finds IN 10.
 */
export function filterForms(forms: CbmscForm[], query: string): CbmscForm[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return forms;
  return forms.filter((form) => {
    const text = normalize(
      `IN ${form.normative} Anexo ${form.annex} ${form.name}`,
    );
    return words.every((word) => text.includes(word));
  });
}

export const fetchFormVersion = (googleDocId: string) =>
  requestJson<{ textHash: string }>(
    `/api/documents/forms/${googleDocId}/version`,
  );

/**
 * The tagged copy of a form. Matched by IN and annex, not by Google Doc id, so
 * replacing a form's link in the catalog keeps its template.
 */
export const findFormTemplate = (
  templates: TemplateEntry[],
  form: Pick<CbmscForm, "normative" | "annex">,
) =>
  templates.find(
    ({ cbmsc }) =>
      cbmsc?.normative === form.normative && cbmsc.annex === form.annex,
  );

export type AssistantState =
  "unavailable" | "checking" | "ready" | "unverified" | "outdated";

/**
 * Whether the assistant can fill a form. `currentHash` is `undefined` while
 * loading and `null` when Google could not be read: then the copy may still be
 * right, so it stays usable with a warning, unlike a text known to have changed.
 */
export function assistantState(
  template: TemplateEntry | undefined,
  currentHash: string | null | undefined,
): AssistantState {
  if (!template?.cbmsc) return "unavailable";
  if (currentHash === undefined) return "checking";
  if (currentHash === null) return "unverified";
  return currentHash === template.cbmsc.sourceTextHash ? "ready" : "outdated";
}
