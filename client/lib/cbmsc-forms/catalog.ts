import type { Database } from "@/lib/supabase/database.types";
import type { CbmscForm } from "./types";

type FormKey = Pick<CbmscForm, "normative" | "annex" | "name">;

/** IN number, then annex (single letters before two letters), then name. */
export function compareForms(a: FormKey, b: FormKey): number {
  return (
    a.normative - b.normative ||
    a.annex.length - b.annex.length ||
    a.annex.localeCompare(b.annex) ||
    a.name.localeCompare(b.name, "pt-BR")
  );
}

export type NormativeGroup<T> = { normative: number; forms: T[] };

/** Forms grouped by IN, groups and forms in `compareForms` order. */
export function groupByNormative<T extends FormKey>(
  forms: T[],
): NormativeGroup<T>[] {
  const groups: NormativeGroup<T>[] = [];
  for (const form of [...forms].sort(compareForms)) {
    const last = groups.at(-1);
    if (last?.normative === form.normative) last.forms.push(form);
    else groups.push({ normative: form.normative, forms: [form] });
  }
  return groups;
}

export const formLabel = (form: Pick<CbmscForm, "normative" | "annex">) =>
  `IN ${form.normative} · Anexo ${form.annex}`;

export const FORM_COLUMNS = "google_doc_id, normative, annex, name, active";

type FormRow = Pick<
  Database["public"]["Tables"]["cbmsc_forms"]["Row"],
  "google_doc_id" | "normative" | "annex" | "name" | "active"
>;

export const fromFormRow = (row: FormRow): CbmscForm => ({
  googleDocId: row.google_doc_id,
  normative: row.normative,
  annex: row.annex,
  name: row.name,
  active: row.active,
});
