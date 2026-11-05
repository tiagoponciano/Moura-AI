import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { toDocumentText } from "./form-values";
import type { FieldValues, TemplateEntry, TemplateSchema } from "./templates";

/** The file name of a generated document, without characters unsafe in file names. */
export function documentFileName(
  template: Pick<TemplateEntry, "id">,
  values: FieldValues,
  extension: "docx" | "pdf",
): string {
  const companyName =
    typeof values.company_name === "string" ? values.company_name : "";
  const safeName = companyName
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_");
  return safeName
    ? `${template.id}_${safeName}.${extension}`
    : `${template.id}.${extension}`;
}

/** Injects the values into a tagged `.docx`, leaving the rest of the file intact. */
export function renderDocx(
  template: Uint8Array,
  schema: TemplateSchema,
  values: FieldValues,
): Uint8Array {
  const doc = new Docxtemplater(new PizZip(template), {
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
  return doc.getZip().generate({ type: "uint8array" });
}
