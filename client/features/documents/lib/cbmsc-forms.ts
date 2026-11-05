import { requestJson } from "@/lib/api/request-json";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";

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
