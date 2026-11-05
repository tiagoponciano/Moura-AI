/** One official CBMSC form: a public Google Doc that the CBMSC keeps up to date. */
export type CbmscForm = {
  googleDocId: string;
  /** IN number: `1` for "IN 1". */
  normative: number;
  /** Annex letter: `"D"` for "Anexo D". */
  annex: string;
  name: string;
  active: boolean;
};

/** A form read from a pasted link, before an admin saves it. */
export type CbmscFormDraft = {
  googleDocId: string;
  /** `null` when the Google Doc title does not follow "IN n - Anexo X - name". */
  normative: number | null;
  annex: string | null;
  name: string;
  /** Whether the catalog already has this Google Doc. */
  listed: boolean;
};
