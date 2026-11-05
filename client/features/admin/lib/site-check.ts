import { formLabel } from "@/lib/cbmsc-forms/catalog";
import type { CbmscForm, SiteCheck, SiteForm } from "@/lib/cbmsc-forms/types";

/** What the latest site check says about the catalog as it is now. */
export type SiteDifference =
  | { kind: "link_changed"; form: CbmscForm; site: SiteForm }
  | { kind: "details_changed"; form: CbmscForm; site: SiteForm }
  | { kind: "new"; site: SiteForm }
  | { kind: "removed"; form: CbmscForm };

const sameDetails = (form: CbmscForm, site: SiteForm) =>
  form.name === site.name &&
  form.normative === site.normative &&
  form.annex === site.annex;

/**
 * Compares a site check to the catalog. A failed check says nothing, and a
 * partial one reports no removals because an absence proves nothing. Inactive
 * forms were hidden on purpose, so only their id counts: they never warn.
 */
export function diffSiteCheck(
  forms: CbmscForm[],
  check: SiteCheck,
): SiteDifference[] {
  if (check.status === "failed") return [];

  const onSite = new Set(check.forms.map((site) => site.googleDocId));
  const replaced = new Set<string>();
  const differences: SiteDifference[] = [];

  for (const site of check.forms) {
    const form = forms.find((f) => f.googleDocId === site.googleDocId);
    if (form) {
      if (form.active && site.normative !== null && !sameDetails(form, site)) {
        differences.push({ kind: "details_changed", form, site });
      }
      continue;
    }
    const candidates = forms.filter(
      (f) =>
        f.active &&
        f.normative === site.normative &&
        f.annex === site.annex &&
        !onSite.has(f.googleDocId),
    );
    if (candidates.length === 1) {
      replaced.add(candidates[0].googleDocId);
      differences.push({ kind: "link_changed", form: candidates[0], site });
    } else {
      differences.push({ kind: "new", site });
    }
  }

  if (check.status === "complete") {
    for (const form of forms) {
      if (
        form.active &&
        !onSite.has(form.googleDocId) &&
        !replaced.has(form.googleDocId)
      ) {
        differences.push({ kind: "removed", form });
      }
    }
  }
  return differences;
}

const siteLabel = (site: SiteForm) =>
  site.normative !== null && site.annex !== null
    ? `${formLabel({ normative: site.normative, annex: site.annex })}: ${site.name}`
    : site.name;

/** The on-screen text of a difference; no action when it needs the import card. */
export function describeDifference(difference: SiteDifference): {
  title: string;
  detail: string;
  action?: string;
} {
  switch (difference.kind) {
    case "link_changed":
      return {
        title: "Link mudou",
        detail: siteLabel(difference.site),
        action: "Trocar link",
      };
    case "details_changed":
      return {
        title: "Dados mudaram",
        detail: `${formLabel(difference.form)}: ${difference.form.name} → ${siteLabel(difference.site)}`,
        action: "Atualizar",
      };
    case "new":
      return difference.site.normative !== null
        ? {
            title: "Novo anexo",
            detail: siteLabel(difference.site),
            action: "Adicionar",
          }
        : {
            title: "Novo anexo",
            detail: `${difference.site.name} (título fora do padrão: cole o link em “Adicionar formulários”)`,
          };
    case "removed":
      return {
        title: "Saiu do site",
        detail: `${formLabel(difference.form)}: ${difference.form.name}`,
        action: "Desativar",
      };
  }
}

/** The warning on the forms tab; `undefined` when there is nothing to act on. */
export function siteCheckWarning(
  check: SiteCheck | null | undefined,
  differences: SiteDifference[],
): string | undefined {
  if (check?.status === "failed") return "Verificação do site falhou";
  if (!differences.length) return undefined;
  return differences.length === 1
    ? "1 aviso do site"
    : `${differences.length} avisos do site`;
}

/** The catalog row a difference acts on, or the site's doc when it has no row yet. */
export const differenceTargetId = (difference: SiteDifference) =>
  difference.kind === "new"
    ? difference.site.googleDocId
    : difference.form.googleDocId;

export const differenceKey = (difference: SiteDifference) =>
  `${difference.kind}:${differenceTargetId(difference)}`;

/** The result sentence of the panel. */
export function siteCheckStatusLine(
  check: SiteCheck,
  differences: SiteDifference[],
): string {
  if (check.status === "failed") {
    return "Não foi possível ler o site; confira manualmente.";
  }
  const found = differences.length
    ? "Encontramos diferenças."
    : "Nenhuma diferença.";
  return check.status === "partial"
    ? `${found} ${check.failures} item(ns) não puderam ser lidos, então anexos que saíram do site não são apontados.`
    : found;
}
