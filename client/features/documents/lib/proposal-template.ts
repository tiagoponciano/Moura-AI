import { proposalValues } from "./proposal";
import { pptxTags } from "./render-pptx";

/** The largest deck the admin console accepts; the bucket enforces the same. */
export const MAX_TEMPLATE_BYTES = 20 * 1024 * 1024;

export const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Every `{{tag}}` the app has a value for. */
export const PROPOSAL_TAGS: readonly string[] = Object.keys(
  proposalValues(
    { name: "", data: {} },
    {
      planId: "complete-management",
      price: 1,
      validityDays: 1,
      format: "pptx",
    },
    new Date(0),
  ),
).sort();

export type TemplateCheck =
  | { ok: true; tags: string[]; unused: string[] }
  | { ok: false; reason: string; unknown: string[] };

/**
 * Whether a deck can be the proposal template: a readable `.pptx` whose tags
 * are all ones the app fills. A tag the app does not know would print as empty
 * text, so the deck is refused. A tag the deck lacks is fine: that part of the
 * proposal is simply written in the design, and `unused` lists it.
 */
export function checkProposalTemplate(file: Uint8Array): TemplateCheck {
  let found: Set<string>;
  try {
    found = pptxTags(file);
  } catch {
    return {
      ok: false,
      reason: "O arquivo não é uma apresentação .pptx válida.",
      unknown: [],
    };
  }
  const unknown = [...found]
    .filter((tag) => !PROPOSAL_TAGS.includes(tag))
    .sort();
  if (unknown.length) {
    return {
      ok: false,
      reason: "O modelo usa etiquetas que o app não preenche.",
      unknown,
    };
  }
  return {
    ok: true,
    tags: [...found].sort(),
    unused: PROPOSAL_TAGS.filter((tag) => !found.has(tag)),
  };
}
