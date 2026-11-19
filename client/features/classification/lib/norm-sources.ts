import in1p1 from "../norms/in-1-p1/manifest.json";
import in1p2 from "../norms/in-1-p2/manifest.json";
import in3 from "../norms/in-3/manifest.json";
import in5 from "../norms/in-5/manifest.json";

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

const MANIFESTS: Manifest[] = [in1p1, in1p2, in3, in5];

/** The norms the classification is built on, in the order of their instruction number. */
export function listNormSources(): NormSource[] {
  return MANIFESTS.map(summarizeManifest);
}
