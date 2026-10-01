import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const outputPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/templates/bombeiro/exemplo.docx",
);

const rows = [
  ["Razão social", "{{razao_social}}"],
  ["Endereço", "{{endereco}}"],
  ["Área (m²)", "{{area_m2}}"],
  ["Ocupação", "{{ocupacao}}"],
  ["Nº de pavimentos", "{{num_pavimentos}}"],
];

const cell = (text, bold = false) =>
  new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
  });

const doc = new Document({
  sections: [
    {
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: "FORMULÁRIO DE EXEMPLO – CBMSC", bold: true })],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: rows.map(([label, tag]) => new TableRow({ children: [cell(label, true), cell(tag)] })),
        }),
        new Paragraph({
          spacing: { before: 400 },
          children: [new TextRun("Florianópolis, {{data}}.")],
        }),
      ],
    },
  ],
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, await Packer.toBuffer(doc));
console.log(`Template written to ${outputPath}`);
