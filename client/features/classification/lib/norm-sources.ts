import nt_01_2025 from "../norms/notes/nt-01-2025/manifest.json";
import nt_02_2025 from "../norms/notes/nt-02-2025/manifest.json";
import cartilha from "../norms/cartilha/manifest.json";
import in_1_p1 from "../norms/in-1-p1/manifest.json";
import in_1_p2 from "../norms/in-1-p2/manifest.json";
import in_2 from "../norms/in-2/manifest.json";
import in_3 from "../norms/in-3/manifest.json";
import in_4 from "../norms/in-4/manifest.json";
import in_5 from "../norms/in-5/manifest.json";
import in_6 from "../norms/in-6/manifest.json";
import in_7 from "../norms/in-7/manifest.json";
import in_8 from "../norms/in-8/manifest.json";
import in_9 from "../norms/in-9/manifest.json";
import in_10 from "../norms/in-10/manifest.json";
import in_11 from "../norms/in-11/manifest.json";
import in_12 from "../norms/in-12/manifest.json";
import in_13 from "../norms/in-13/manifest.json";
import in_14 from "../norms/in-14/manifest.json";
import in_15 from "../norms/in-15/manifest.json";
import in_18 from "../norms/in-18/manifest.json";
import in_19 from "../norms/in-19/manifest.json";
import in_20 from "../norms/in-20/manifest.json";
import in_21 from "../norms/in-21/manifest.json";
import in_22 from "../norms/in-22/manifest.json";
import in_23 from "../norms/in-23/manifest.json";
import in_24 from "../norms/in-24/manifest.json";
import in_25 from "../norms/in-25/manifest.json";
import in_26 from "../norms/in-26/manifest.json";
import in_27 from "../norms/in-27/manifest.json";
import in_28 from "../norms/in-28/manifest.json";
import in_29 from "../norms/in-29/manifest.json";
import in_30 from "../norms/in-30/manifest.json";
import in_31 from "../norms/in-31/manifest.json";
import in_33 from "../norms/in-33/manifest.json";
import in_34 from "../norms/in-34/manifest.json";
import in_35 from "../norms/in-35/manifest.json";

/** What the admin console shows about one norm: where it came from and how it was read. */
export type NormSource = {
  /** Document code, like `IN-1-P2`. */
  doc: string;
  /** Link to the PDF the data were extracted from. */
  sourceUrl: string;
  /** Date of the extraction, `YYYY-MM-DD`. */
  retrieved: string;
  pages: number;
  /** Items a person still has to check against the printed norm. */
  needsHumanLook: number;
};

type Manifest = {
  doc: string;
  source_url: string;
  retrieved: string;
  pdf_pages: number;
  [key: string]: unknown;
};

/** Counts every `needs_human_look` number in the manifest's annexes and tables. */
function countHumanLook(manifest: Manifest): number {
  let total = 0;
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const entry = value as { needs_human_look?: unknown };
    if (typeof entry.needs_human_look === "number") {
      total += entry.needs_human_look;
    }
  };
  for (const value of Object.values(manifest)) {
    if (Array.isArray(value)) value.forEach(visit);
    else visit(value);
  }
  return total;
}

export function summarizeManifest(manifest: Manifest): NormSource {
  return {
    doc: manifest.doc,
    sourceUrl: manifest.source_url,
    retrieved: manifest.retrieved,
    pages: manifest.pdf_pages,
    needsHumanLook: countHumanLook(manifest),
  };
}

/** Every instruction with a manifest, in the order of its number, then the guide for responsible engineers and the technical notes. */
const MANIFESTS: Manifest[] = [
  in_1_p1,
  in_1_p2,
  in_2,
  in_3,
  in_4,
  in_5,
  in_6,
  in_7,
  in_8,
  in_9,
  in_10,
  in_11,
  in_12,
  in_13,
  in_14,
  in_15,
  in_18,
  in_19,
  in_20,
  in_21,
  in_22,
  in_23,
  in_24,
  in_25,
  in_26,
  in_27,
  in_28,
  in_29,
  in_30,
  in_31,
  in_33,
  in_34,
  in_35,
  cartilha,
  nt_01_2025,
  nt_02_2025,
];

/** The norms the app keeps, in the order of their instruction number. */
export function listNormSources(): NormSource[] {
  return MANIFESTS.map(summarizeManifest);
}
