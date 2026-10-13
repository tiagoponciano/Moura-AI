import { describe, expect, it } from "vitest";
import {
  isEmptyValue,
  pickExtractedValues,
  requiredProgress,
  validateForDocument,
} from "./form-values";
import type { TemplateSchema } from "./templates";

const schema: TemplateSchema = {
  fields: [
    {
      name: "company_name",
      type: "string",
      label: "Razão social",
      description: "Razão social do proprietário do imóvel",
      required: true,
    },
    {
      name: "area_m2",
      type: "number",
      label: "Área",
      description: "Área total construída, em metros quadrados",
      required: true,
    },
    {
      name: "has_sprinklers",
      type: "boolean",
      label: "Chuveiros",
      description: "Possui chuveiros automáticos",
      required: true,
    },
    {
      name: "issue_date",
      type: "date",
      label: "Data",
      description: "Data de emissão do formulário",
    },
  ],
};

describe("isEmptyValue", () => {
  it.each([undefined, "", "   "])("treats %j as empty", (value) => {
    expect(isEmptyValue(value)).toBe(true);
  });

  it.each([0, false, "a"])("treats %j as filled", (value) => {
    expect(isEmptyValue(value)).toBe(false);
  });
});

describe("pickExtractedValues", () => {
  it("keeps schema fields holding non-empty scalars", () => {
    const output = {
      company_name: "Padaria Silva",
      area_m2: 750,
      has_sprinklers: false,
    };
    expect(pickExtractedValues(schema, output)).toEqual(output);
  });

  it("drops keys that are not in the schema", () => {
    expect(pickExtractedValues(schema, { owner_cpf: "123" })).toEqual({});
  });

  it("drops empty and whitespace-only strings", () => {
    expect(pickExtractedValues(schema, { company_name: "  " })).toEqual({});
  });

  it("drops objects, arrays and null", () => {
    const output = {
      company_name: { text: "x" },
      area_m2: [750],
      issue_date: null,
    };
    expect(pickExtractedValues(schema, output)).toEqual({});
  });

  it("returns nothing for a non-object output", () => {
    expect(pickExtractedValues(schema, "Padaria Silva")).toEqual({});
  });
});

describe("requiredProgress", () => {
  it("counts required booleans as filled even when unset", () => {
    expect(requiredProgress(schema, {})).toEqual({ filled: 1, total: 3 });
  });

  it("does not count a whitespace-only string as filled", () => {
    expect(
      requiredProgress(schema, { company_name: " ", area_m2: 750 }),
    ).toEqual({
      filled: 2,
      total: 3,
    });
  });

  it("ignores optional fields in both counts", () => {
    expect(requiredProgress(schema, { issue_date: "05/10/2026" }).total).toBe(
      3,
    );
  });

  it("reports zero of zero for a schema without required fields", () => {
    const optionalOnly: TemplateSchema = {
      fields: [
        { name: "notes", type: "string", label: "Notas", description: "Notas" },
      ],
    };
    expect(requiredProgress(optionalOnly, {})).toEqual({ filled: 0, total: 0 });
  });
});

describe("validateForDocument", () => {
  const complete = {
    company_name: "Padaria Silva",
    area_m2: 750,
    has_sprinklers: true,
  };

  it("returns the values without empty entries when valid", () => {
    const result = validateForDocument(schema, { ...complete, issue_date: "" });
    expect(result).toEqual({ ok: true, values: complete });
  });

  it("reports a missing required field as obrigatório", () => {
    const result = validateForDocument(schema, {
      ...complete,
      company_name: "",
    });
    expect(result).toEqual({
      ok: false,
      problems: ["Razão social: obrigatório"],
    });
  });

  it("reports an invalid value with the field label and zod message", () => {
    const result = validateForDocument(schema, {
      ...complete,
      issue_date: "2026-10-05",
    });
    expect(result).toEqual({
      ok: false,
      problems: ["Data: Use o formato DD/MM/AAAA"],
    });
  });

  it("treats an untouched boolean as false, as the switch displays it", () => {
    const untouched = { company_name: "Padaria Silva", area_m2: 750 };
    expect(validateForDocument(schema, untouched)).toEqual({
      ok: true,
      values: { ...complete, has_sprinklers: false },
    });
  });

  it("lists one problem per failing field", () => {
    const result = validateForDocument(schema, { has_sprinklers: false });
    expect(result.ok === false && result.problems).toEqual([
      "Razão social: obrigatório",
      "Área: obrigatório",
    ]);
  });
});
