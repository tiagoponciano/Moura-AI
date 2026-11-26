import { describe, expect, it } from "vitest";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { countFormRows, filterFormRows, toFormRows } from "./forms-table";
import type { TemplateEntry } from "./templates";

const form = (normative: number, annex: string, name: string): CbmscForm => ({
  googleDocId: `${normative}${annex}`,
  normative,
  annex,
  name,
  active: true,
});

const template = (
  id: string,
  normative: number,
  annex: string,
): TemplateEntry => ({
  id,
  name: id,
  type: "docx",
  file: "",
  schema: "",
  cbmsc: { normative, annex, sourceTextHash: "x", reviewed: true },
});

const filling = (template_id: string, updated_at: string) => ({
  template_id,
  values: {},
  updated_at,
});

const forms = [
  form(9, "B", "Saídas"),
  form(1, "A", "Carga"),
  form(1, "B", "Risco"),
];
const templates = [template("in1-a", 1, "A"), template("in9-b", 9, "B")];

describe("toFormRows", () => {
  it("lists the forms by IN and annex", () => {
    const rows = toFormRows(forms, templates, []);
    expect(rows.map((row) => row.form.googleDocId)).toEqual(["1A", "1B", "9B"]);
  });

  it("gives each form the template of its IN and annex, and none when there is none", () => {
    const rows = toFormRows(forms, templates, []);
    expect(rows.map((row) => row.template?.id)).toEqual([
      "in1-a",
      undefined,
      "in9-b",
    ]);
  });

  it("marks a form as started with the latest save of its template", () => {
    const rows = toFormRows(forms, templates, [
      filling("in1-a", "2026-11-01T10:00:00Z"),
      filling("in1-a", "2026-11-03T10:00:00Z"),
    ]);
    expect(rows[0].startedAt).toBe("2026-11-03T10:00:00Z");
    expect(rows[2].startedAt).toBeUndefined();
  });
});

describe("filterFormRows", () => {
  const rows = toFormRows(forms, templates, [
    filling("in9-b", "2026-11-01T10:00:00Z"),
  ]);

  it("keeps only the started forms", () => {
    expect(
      filterFormRows(rows, "started").map((row) => row.form.googleDocId),
    ).toEqual(["9B"]);
  });

  it("keeps only the forms the assistant can fill", () => {
    expect(filterFormRows(rows, "assistant")).toHaveLength(2);
  });

  it("counts every filter", () => {
    expect(countFormRows(rows)).toEqual({ all: 3, started: 1, assistant: 2 });
  });
});
