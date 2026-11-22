import PizZip from "pizzip";
import type { Classification } from "./classify";

/** One paragraph of the report. */
export type ReportLine = { text: string; style?: "title" | "heading" };

/** The sentences of the report, from a classification already worked out. */
export function reportLines(
  classification: Classification,
  projectName: string | undefined,
): ReportLine[] {
  const lines: ReportLine[] = [
    { text: "Classificação da edificação", style: "title" },
  ];
  if (projectName) lines.push({ text: `Projeto: ${projectName}` });

  lines.push({ text: "Risco", style: "heading" });
  const { risk } = classification;
  if (classification.status === "analysis") {
    lines.push({
      text: "As regras pedem uma análise específica; nenhum sistema foi listado.",
    });
  } else if (risk?.status === "decided") {
    lines.push({ text: `Risco ${risk.level}: ${risk.process}` });
    lines.push({ text: `Fonte: ${risk.reason.locator}` });
  } else {
    lines.push({ text: "O risco ainda depende de respostas que faltam." });
  }

  const { required, needsInfo } = classification.groups;
  lines.push({ text: "Sistemas exigidos", style: "heading" });
  if (required.length === 0) lines.push({ text: "Nenhum até agora." });
  for (const system of required) {
    const source = system.reasons[0]?.locator;
    lines.push({ text: source ? `${system.label} (${source})` : system.label });
  }

  if (needsInfo.length > 0) {
    lines.push({ text: "Dependem de informação", style: "heading" });
    for (const system of needsInfo) {
      const missing = system.missing.length
        ? `: falta ${system.missing.join(", ")}`
        : "";
      lines.push({ text: `${system.label}${missing}` });
    }
  }

  if (classification.status !== "complete") {
    lines.push({
      text: "Resultado provisório: há respostas pendentes. Confira com a norma antes de usar.",
    });
  }
  return lines;
}

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function paragraph({ text, style }: ReportLine): string {
  const props =
    style === "title"
      ? '<w:pPr><w:spacing w:after="240"/></w:pPr>'
      : style === "heading"
        ? '<w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>'
        : '<w:pPr><w:spacing w:after="80"/></w:pPr>';
  const run = style
    ? `<w:rPr><w:b/><w:sz w:val="${style === "title" ? 32 : 26}"/></w:rPr>`
    : "";
  return `<w:p>${props}<w:r>${run}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

/** A minimal `.docx` with one paragraph per line, built here with no template file. */
export function buildReportDocx(lines: ReportLine[]): Blob {
  const zip = new PizZip();
  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${lines.map(paragraph).join("")}</w:body></w:document>`,
  );
  return new Blob([zip.generate({ type: "arraybuffer" })], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
