import type { Reason, SystemView } from "./classify";
import type { Rule, SystemOutcome } from "./engine/types";
import { systemLabel } from "./rulesets/systems";

export type ViewContext = {
  byId: Map<string, Rule>;
  /** Whether a pending fact can be asked now, so it is worth naming. */
  isAskable: (fact: string) => boolean;
  labelOf: (fact: string) => string;
};

/** The printed source of a rule, for "why is this required?". */
export function reasonOf(byId: Map<string, Rule>, id: string): Reason {
  const source = byId.get(id)?.source;
  return { locator: source?.locator ?? id, quote: source?.quote };
}

/** One system of an evaluation as the screen shows it. */
export function systemView(
  system: SystemOutcome,
  { byId, isAskable, labelOf }: ViewContext,
): SystemView {
  const seen = new Set<string>();
  const reasons = system.ruleIds
    .map((id) => reasonOf(byId, id))
    .filter((r) => !seen.has(r.locator) && seen.add(r.locator));
  return {
    id: system.id,
    label: systemLabel(system.id),
    status: system.status,
    vital: system.vital,
    treatment: system.overlayClass,
    partial: system.partial,
    scopes: system.scopes,
    substitutions: system.substitutions.map((s) => ({
      by: s.by.map(systemLabel),
      alreadyRequired: s.alreadyRequired.map(systemLabel),
      note: s.note,
    })),
    reasons: system.status === "needs_info" ? [] : reasons,
    notes: [
      ...new Set(
        system.ruleIds.flatMap((id) => {
          const note = byId.get(id)?.note;
          return note ? [note] : [];
        }),
      ),
    ],
    missing: system.missing.filter(isAskable).map(labelOf),
  };
}
