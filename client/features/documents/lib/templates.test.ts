import { describe, expect, it } from "vitest";
import { chatEmptyState, type TemplateSchema } from "./templates";

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

describe("chatEmptyState", () => {
  it("names the required fields", () => {
    expect(chatEmptyState(schema)).toContain(
      "Para começar, preciso de: Nome, Descrição.",
    );
  });

  it("omits the list when no field is required", () => {
    expect(chatEmptyState({ fields: [schema.fields[1]] })).not.toContain(
      "preciso de",
    );
  });
});
