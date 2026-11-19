import type { AdminNormSource } from "./types";

/** The line under the Normas tab: how many norms and how many items still wait for a person. */
export function normsSummary(norms: AdminNormSource[] | undefined): string {
  if (!norms) return "Carregando…";
  const waiting = norms.reduce((sum, n) => sum + n.needsHumanLook, 0);
  const count = `${norms.length} ${norms.length === 1 ? "norma" : "normas"}`;
  return waiting > 0 ? `${count} · ${waiting} a conferir` : count;
}

/** `2026-11-19` as `19/11/2026`; anything else is shown as it came. */
export function formatRetrieved(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
}

/** `IN-1-P2` as `IN 1 parte 2`; anything else is shown as it came. */
export function normLabel(doc: string): string {
  const match = /^IN-(\d+)(?:-P(\d+))?$/.exec(doc);
  if (!match) return doc;
  return match[2] ? `IN ${match[1]} parte ${match[2]}` : `IN ${match[1]}`;
}
