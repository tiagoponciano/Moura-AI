import { describe, expect, it } from "vitest";
import {
  draftsToSave,
  formsSummary,
  toEditableDrafts,
  type EditableDraft,
} from "./forms";

const ID = "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs";

const editable = (patch: Partial<EditableDraft> = {}): EditableDraft => ({
  googleDocId: ID,
  normative: "1",
  annex: "D",
  name: "Consulta técnica",
  listed: false,
  selected: true,
  ...patch,
});

describe("toEditableDrafts", () => {
  it("leaves forms already in the catalog unselected", () => {
    const [draft] = toEditableDrafts([
      { googleDocId: ID, normative: 1, annex: "D", name: "x", listed: true },
    ]);
    expect(draft.selected).toBe(false);
  });

  it("turns an unparsed IN and annex into empty inputs", () => {
    const [draft] = toEditableDrafts([
      {
        googleDocId: ID,
        normative: null,
        annex: null,
        name: "x",
        listed: false,
      },
    ]);
    expect(draft).toMatchObject({ normative: "", annex: "", selected: true });
  });
});

describe("draftsToSave", () => {
  it("sends only selected drafts, with IN as a number", () => {
    const result = draftsToSave([
      editable(),
      editable({ googleDocId: `${ID}x`, selected: false }),
    ]);
    expect(result).toEqual({
      forms: [
        { googleDocId: ID, normative: 1, annex: "D", name: "Consulta técnica" },
      ],
      problems: [],
    });
  });

  it("reports a selected draft with an empty IN by its name", () => {
    expect(draftsToSave([editable({ normative: "" })]).problems).toEqual([
      "Consulta técnica: Informe o número da IN",
    ]);
  });

  it("reports a draft without a name by its Google Doc id", () => {
    expect(draftsToSave([editable({ name: " " })]).problems).toEqual([
      `${ID}: Informe o nome`,
    ]);
  });
});

describe("formsSummary", () => {
  const form = { googleDocId: ID, normative: 1, annex: "D", name: "x" };

  it("counts only active forms, in the singular for one", () => {
    expect(
      formsSummary([
        { ...form, active: true },
        { ...form, active: false },
      ]),
    ).toBe("1 ativo");
  });

  it("uses the plural for any other count", () => {
    expect(
      formsSummary([
        { ...form, active: true },
        { ...form, active: true },
      ]),
    ).toBe("2 ativos");
  });

  it("shows loading before the list arrives", () => {
    expect(formsSummary(undefined)).toBe("Carregando…");
  });
});
