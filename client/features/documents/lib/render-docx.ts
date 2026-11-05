import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import { toDocumentText } from "./form-values";
import type { FieldValues, TemplateEntry, TemplateSchema } from "./templates";

function buildFileName(template: TemplateEntry, values: FieldValues): string {
  const companyName =
    typeof values.company_name === "string" ? values.company_name : "";
  const safeName = companyName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_");
  return safeName ? `${template.id}_${safeName}.docx` : `${template.id}.docx`;
}

export async function renderDocx(
  template: TemplateEntry,
  schema: TemplateSchema,
  values: FieldValues,
): Promise<void> {
  const response = await fetch(template.file, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Failed to load template ${template.file}: HTTP ${response.status}`,
    );
  }

  const zip = new PizZip(await response.arrayBuffer());
  const doc = new Docxtemplater(zip, {
    delimiters: { start: "{{", end: "}}" },
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    // Accept both {{field}} and {{ field }}; the default parser does not trim.
    parser: (tag) => {
      const key = tag.trim();
      return { get: (scope) => (key === "." ? scope : scope[key]) };
    },
  });

  doc.render(toDocumentText(schema, values));

  const blob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  saveAs(blob, buildFileName(template, values));
}
