import { describe, expect, it } from "vitest";
import type { Answer, ChecklistGroup } from "./ppci-answers";
import { pendingGroups, reportHtml } from "./ppci-report";

const item = (
  position: number,
  text: string,
  section: string | null = null,
) => ({
  position,
  section,
  text,
  reference: null,
});

const groups: ChecklistGroup[] = [
  {
    position: 1,
    name: "Extintores",
    items: [item(1, "Definir o agente"), item(2, "Prever sinalização")],
  },
  { position: 2, name: "Alarme", items: [item(1, "Acionadores", "Painel")] },
];

const answer = (
  group_position: number,
  item_position: number,
  status: Answer["status"],
  note: string | null = null,
): Answer => ({
  group_position,
  item_position,
  status,
  note,
  updated_by_name: null,
  updated_at: "2026-11-11T10:00:00Z",
});

describe("pendingGroups", () => {
  it("keeps only the items answered Adequar", () => {
    const result = pendingGroups(groups, [
      answer(1, 1, "adequar"),
      answer(1, 2, "atende"),
      answer(2, 1, "na"),
    ]);
    expect(result).toEqual([
      {
        name: "Extintores",
        items: [{ text: "Definir o agente", section: null, note: null }],
      },
    ]);
  });

  it("carries the note and the section of the item", () => {
    const [group] = pendingGroups(groups, [
      answer(2, 1, "adequar", "ver prancha 3"),
    ]);
    expect(group.items[0]).toEqual({
      text: "Acionadores",
      section: "Painel",
      note: "ver prancha 3",
    });
  });

  it("leaves out items that were never answered", () => {
    expect(pendingGroups(groups, [])).toEqual([]);
  });
});

describe("reportHtml", () => {
  const header = { projectName: "Padaria <Silva>", date: "11/11/2026" };

  it("escapes text coming from the project", () => {
    const html = reportHtml(header, []);
    expect(html).toContain("Padaria &lt;Silva&gt;");
    expect(html).not.toContain("<Silva>");
  });

  it("says so when nothing is left to adjust", () => {
    expect(reportHtml(header, [])).toContain("Nenhum item a adequar.");
  });

  it("lists the technical lead with the registry when known", () => {
    const html = reportHtml(
      { ...header, technicalName: "Ana", technicalRegistry: "CREA 123" },
      [],
    );
    expect(html).toContain("Responsável técnico: Ana · CREA 123");
  });

  it("omits the technical lead line when unknown", () => {
    expect(reportHtml(header, [])).not.toContain("Responsável técnico");
  });

  it("prints a note under its item", () => {
    const html = reportHtml(header, [
      {
        name: "Alarme",
        items: [{ text: "Acionadores", section: null, note: "prancha 3" }],
      },
    ]);
    expect(html).toContain('<p class="note">prancha 3</p>');
  });
});
