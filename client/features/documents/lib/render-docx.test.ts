import { readFileSync } from "node:fs";
import { join } from "node:path";
import PizZip from "pizzip";
import { describe, expect, it } from "vitest";
import { documentFileName, renderDocx } from "./render-docx";
import type { TemplateSchema } from "./templates";

const CBMSC = join(__dirname, "../../../public/templates/cbmsc");
const template = readFileSync(join(CBMSC, "in-1-anexo-d.docx"));
const schema = JSON.parse(
  readFileSync(join(CBMSC, "in-1-anexo-d.schema.json"), "utf8"),
) as TemplateSchema;

const textOf = (docx: Uint8Array) =>
  new PizZip(docx).file("word/document.xml")?.asText() ?? "";

describe("renderDocx", () => {
  it("writes each value into the official form", () => {
    const xml = textOf(
      renderDocx(template, schema, {
        requester_name: "João Silva",
        question: "Pode usar escada comum?",
      }),
    );
    expect(xml).toContain("João Silva");
    expect(xml).toContain("Pode usar escada comum?");
  });

  it("prints an X only on the option that is true", () => {
    const xml = textOf(
      renderDocx(template, schema, {
        external_query: true,
        internal_query: false,
      }),
    );
    expect(xml).toContain("( X ) externa");
    expect(xml).toContain("(  ) interna");
  });

  it("leaves no tag behind when a field is empty", () => {
    expect(textOf(renderDocx(template, schema, {}))).not.toContain("{{");
  });
});

describe("documentFileName", () => {
  it("uses the company name when there is one, without unsafe characters", () => {
    expect(
      documentFileName({ id: "x" }, { company_name: 'A/B "Ltda" SA' }, "pdf"),
    ).toBe("x_AB_Ltda_SA.pdf");
  });

  it("falls back to the template id", () => {
    expect(documentFileName({ id: "x" }, {}, "docx")).toBe("x.docx");
  });
});
