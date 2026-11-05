import { describe, expect, it } from "vitest";
import {
  chatGuidance,
  selectableTemplates,
  type TemplateEntry,
  type TemplateSchema,
} from "./templates";

const example: TemplateEntry = {
  id: "example",
  name: "Exemplo",
  type: "docx",
  file: "/x.docx",
  schema: "/x.json",
};

const official: TemplateEntry = {
  ...example,
  id: "in-1-anexo-d",
  cbmsc: { normative: 1, annex: "D", sourceTextHash: "abc" },
};

const schema: TemplateSchema = {
  fields: [
    {
      name: "a",
      type: "string",
      label: "Nome",
      description: "",
      required: true,
    },
    { name: "b", type: "string", label: "E-mail", description: "" },
    {
      name: "c",
      type: "string",
      label: "Descrição",
      description: "",
      required: true,
    },
  ],
};

describe("selectableTemplates", () => {
  it("leaves out official forms, which open from the dialog", () => {
    expect(selectableTemplates([example, official])).toEqual([example]);
  });
});

describe("chatGuidance", () => {
  it("names the required fields of an official form", () => {
    expect(chatGuidance(official, schema).emptyState).toContain(
      "Para começar, preciso de: Nome, Descrição.",
    );
  });

  it("omits the list when no field is required", () => {
    const optional = { fields: [schema.fields[1]] };
    expect(chatGuidance(official, optional).emptyState).not.toContain(
      "preciso de",
    );
  });

  it("keeps the property example for other templates", () => {
    expect(chatGuidance(example, schema).placeholder).toContain(
      "Padaria Silva",
    );
  });

  it("does not suggest a property on an official form", () => {
    expect(chatGuidance(official, schema).placeholder).not.toContain("Padaria");
  });
});
