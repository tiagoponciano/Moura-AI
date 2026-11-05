import type { CbmscForm, CbmscFormDraft } from "@/lib/cbmsc-forms/types";
import { formDraftSchema, type FormDraftInput } from "./validation";

/** A draft as the import table edits it: IN and annex are raw input text. */
export type EditableDraft = {
  googleDocId: string;
  normative: string;
  annex: string;
  name: string;
  listed: boolean;
  /** Whether "Salvar" sends it; starts off for forms already listed. */
  selected: boolean;
};

export const toEditableDrafts = (drafts: CbmscFormDraft[]): EditableDraft[] =>
  drafts.map((draft) => ({
    googleDocId: draft.googleDocId,
    normative: draft.normative?.toString() ?? "",
    annex: draft.annex ?? "",
    name: draft.name,
    listed: draft.listed,
    selected: !draft.listed,
  }));

/** The selected drafts that validate, and one problem line per selected draft that does not. */
export function draftsToSave(drafts: EditableDraft[]): {
  forms: FormDraftInput[];
  problems: string[];
} {
  const forms: FormDraftInput[] = [];
  const problems: string[] = [];
  for (const draft of drafts) {
    if (!draft.selected) continue;
    const parsed = formDraftSchema.safeParse({
      googleDocId: draft.googleDocId,
      normative: Number(draft.normative),
      annex: draft.annex,
      name: draft.name,
    });
    if (parsed.success) forms.push(parsed.data);
    else
      problems.push(
        `${draft.name.trim() || draft.googleDocId}: ${parsed.error.issues[0]?.message}`,
      );
  }
  return { forms, problems };
}

/** The tab summary (UI copy). */
export function formsSummary(forms: CbmscForm[] | undefined): string {
  if (!forms) return "Carregando…";
  const active = forms.filter((form) => form.active).length;
  return active === 1 ? "1 ativo" : `${active} ativos`;
}
