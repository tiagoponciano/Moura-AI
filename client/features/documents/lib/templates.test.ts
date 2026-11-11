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
  it("asks the current step's question when it has one", () => {
    expect(
      chatEmptyState(schema, { fields: ["a"], question: "Quem pede?" }),
    ).toContain("Quem pede?");
  });

  it("names the step's fields when it has no question", () => {
    expect(chatEmptyState(schema, { fields: ["a", "b"] })).toContain(
      "Para começar: Nome, E-mail.",
    );
  });

  it("says every step is answered when there is no current step", () => {
    expect(chatEmptyState(schema)).toContain(
      "Todas as etapas já estão respondidas.",
    );
  });
});
