import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { buildReportDocx, reportLines } from "./classification-report";
import type { Classification } from "./classify";

const base = {
  status: "complete",
  analyses: [],
  observations: [],
  groups: { required: [], needsInfo: [], notRequired: [] },
  derived: [],
  conflicts: [],
  nextQuestions: [],
  declaredUnknown: [],
  progress: { answered: 3, total: 3 },
} as unknown as Classification;

const system = (label: string, locator?: string, missing: string[] = []) =>
  ({
    id: label,
    label,
    reasons: locator ? [{ locator }] : [],
    missing,
  }) as never;

describe("reportLines", () => {
  it("names the project, the risk with its source and the required systems with theirs", () => {
    const lines = reportLines(
      {
        ...base,
        risk: {
          status: "decided",
          level: "II",
          process: "Processo simplificado",
          reason: { locator: "IN 1, Tabela 2" },
        },
        groups: {
          required: [system("Extintores", "IN 6, art. 4")],
          needsInfo: [],
          notRequired: [],
        },
      },
      "Loja Centro",
    ).map((line) => line.text);
    expect(lines).toContain("Projeto: Loja Centro");
    expect(lines).toContain("Risco II: Processo simplificado");
    expect(lines).toContain("Fonte: IN 1, Tabela 2");
    expect(lines).toContain("Extintores (IN 6, art. 4)");
    expect(lines.join(" ")).not.toContain("provisório");
  });

  it("says what is missing and that the result is provisional when answers are pending", () => {
    const lines = reportLines(
      {
        ...base,
        status: "pending",
        risk: { status: "pending" },
        groups: {
          required: [],
          needsInfo: [system("Sprinklers", undefined, ["altura"])],
          notRequired: [],
        },
      },
      undefined,
    ).map((line) => line.text);
    expect(lines).toContain("O risco ainda depende de respostas que faltam.");
    expect(lines).toContain("Nenhum até agora.");
    expect(lines).toContain("Sprinklers: falta altura");
    expect(lines.some((text) => text.includes("provisório"))).toBe(true);
    expect(lines.some((text) => text.startsWith("Projeto:"))).toBe(false);
  });

  it("does not list systems when the rules stop at a specific analysis", () => {
    const lines = reportLines({ ...base, status: "analysis" }, "X").map(
      (line) => line.text,
    );
    expect(lines).toContain(
      "As regras pedem uma análise específica; nenhum sistema foi listado.",
    );
  });
});

describe("buildReportDocx", () => {
  it("writes each line as a paragraph and escapes markup", async () => {
    const blob = buildReportDocx([
      { text: "Título", style: "title" },
      { text: "A & B <C>" },
    ]);
    const zip = new PizZip(await blob.arrayBuffer());
    const xml = zip.file("word/document.xml")!.asText();
    expect(xml).toContain("Título");
    expect(xml).toContain("A &amp; B &lt;C&gt;");
    expect(xml.match(/<w:p>/g)).toHaveLength(2);
    expect(zip.file("[Content_Types].xml")).not.toBeNull();
  });
});
