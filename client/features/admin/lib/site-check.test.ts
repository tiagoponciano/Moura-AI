import { describe, expect, it } from "vitest";
import type { CbmscForm, SiteCheck, SiteForm } from "@/lib/cbmsc-forms/types";
import {
  describeDifference,
  diffSiteCheck,
  siteCheckStatusLine,
  siteCheckWarning,
} from "./site-check";

const form = (id: string, patch: Partial<CbmscForm> = {}): CbmscForm => ({
  googleDocId: id,
  normative: 1,
  annex: "D",
  name: "Consulta",
  active: true,
  ...patch,
});

const site = (id: string, patch: Partial<SiteForm> = {}): SiteForm => ({
  googleDocId: id,
  normative: 1,
  annex: "D",
  name: "Consulta",
  ...patch,
});

const check = (
  forms: SiteForm[],
  status: SiteCheck["status"] = "complete",
): SiteCheck => ({
  checkedAt: "2026-11-05T12:00:00.000Z",
  status,
  failures: status === "complete" ? 0 : 1,
  forms,
});

const kinds = (forms: CbmscForm[], result: SiteCheck) =>
  diffSiteCheck(forms, result).map((difference) => difference.kind);

describe("diffSiteCheck", () => {
  it("finds nothing when the site matches the catalog", () => {
    expect(kinds([form("a")], check([site("a")]))).toEqual([]);
  });

  it("reports a new id under the same IN and annex once, as a changed link", () => {
    const differences = diffSiteCheck([form("old")], check([site("new")]));
    expect(differences).toEqual([
      { kind: "link_changed", form: form("old"), site: site("new") },
    ]);
  });

  it("reports a changed name on the same id", () => {
    expect(kinds([form("a")], check([site("a", { name: "Outro" })]))).toEqual([
      "details_changed",
    ]);
  });

  it("reports a moved annex on the same id", () => {
    expect(kinds([form("a")], check([site("a", { annex: "E" })]))).toEqual([
      "details_changed",
    ]);
  });

  it("does not compare details when the site title is off-pattern", () => {
    const offPattern = site("a", { normative: null, annex: null, name: "x" });
    expect(kinds([form("a")], check([offPattern]))).toEqual([]);
  });

  it("reports a form missing from the catalog as new", () => {
    expect(kinds([], check([site("a")]))).toEqual(["new"]);
  });

  it("reports an active form gone from the site as removed", () => {
    const other = site("b", { annex: "E" });
    expect(
      kinds([form("a"), form("b", { annex: "E" })], check([other])),
    ).toEqual(["removed"]);
  });

  it("stays silent about inactive forms, on the site or gone", () => {
    const hidden = form("a", { active: false, name: "Antigo" });
    expect(kinds([hidden], check([site("a")]))).toEqual([]);
    expect(
      kinds(
        [hidden, form("b", { annex: "E" })],
        check([site("b", { annex: "E" })]),
      ),
    ).toEqual([]);
  });

  it("does not treat a new id as replacing an inactive form", () => {
    expect(
      kinds([form("old", { active: false })], check([site("new")])),
    ).toEqual(["new"]);
  });

  it("does not guess when two forms share the IN and annex", () => {
    expect(kinds([form("a"), form("b")], check([site("new")]))).toEqual([
      "new",
      "removed",
      "removed",
    ]);
  });

  it("reports no removals from a partial check", () => {
    const other = site("b", { annex: "E" });
    expect(
      kinds([form("a"), form("b", { annex: "E" })], check([other], "partial")),
    ).toEqual([]);
  });

  it("reports nothing from a failed check", () => {
    expect(kinds([form("a")], check([], "failed"))).toEqual([]);
  });
});

describe("describeDifference", () => {
  it("offers no action for a new form without an IN", () => {
    const offPattern = site("a", { normative: null, annex: null, name: "x" });
    expect(
      describeDifference({ kind: "new", site: offPattern }).action,
    ).toBeUndefined();
  });

  it("names the old and new details", () => {
    const described = describeDifference({
      kind: "details_changed",
      form: form("a"),
      site: site("a", { name: "Outro" }),
    });
    expect(described.detail).toBe(
      "IN 1 · Anexo D: Consulta → IN 1 · Anexo D: Outro",
    );
  });
});

describe("siteCheckWarning", () => {
  it("is empty without differences", () => {
    expect(siteCheckWarning(check([]), [])).toBeUndefined();
    expect(siteCheckWarning(undefined, [])).toBeUndefined();
    expect(siteCheckWarning(null, [])).toBeUndefined();
  });

  it("uses the singular for one warning", () => {
    expect(
      siteCheckWarning(check([]), [{ kind: "removed", form: form("a") }]),
    ).toBe("1 aviso do site");
  });

  it("flags a failed check", () => {
    expect(siteCheckWarning(check([], "failed"), [])).toBe(
      "Verificação do site falhou",
    );
  });
});

describe("siteCheckStatusLine", () => {
  it("says when everything matches", () => {
    expect(siteCheckStatusLine(check([]), [])).toBe("Nenhuma diferença.");
  });

  it("explains that a partial check cannot point out removals", () => {
    expect(siteCheckStatusLine(check([], "partial"), [])).toContain(
      "1 item(ns) não puderam ser lidos",
    );
  });

  it("asks for a manual check when the site could not be read", () => {
    expect(siteCheckStatusLine(check([], "failed"), [])).toContain(
      "confira manualmente",
    );
  });
});
