import { describe, expect, it } from "vitest";
import { schemaToZod } from "./schema-to-zod";
import type { TemplateSchema } from "./templates";

const schema: TemplateSchema = {
  fields: [
    {
      name: "company_name",
      type: "string",
      label: "Razão social",
      description: "Razão social",
      required: true,
    },
    {
      name: "area_m2",
      type: "number",
      label: "Área",
      description: "Área",
      required: true,
    },
    {
      name: "has_sprinklers",
      type: "boolean",
      label: "Chuveiros",
      description: "Chuveiros",
    },
    { name: "issue_date", type: "date", label: "Data", description: "Data" },
  ],
};

describe("schemaToZod in extraction mode", () => {
  it("accepts an empty object because every field is optional", () => {
    expect(schemaToZod(schema, "extraction").safeParse({}).success).toBe(true);
  });

  it("accepts an empty string for a string field", () => {
    const result = schemaToZod(schema, "extraction").safeParse({
      company_name: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a number sent as a string", () => {
    const result = schemaToZod(schema, "extraction").safeParse({
      area_m2: "750",
    });
    expect(result.success).toBe(false);
  });
});

describe("schemaToZod in document mode", () => {
  const valid = { company_name: "Padaria Silva", area_m2: 750 };

  it("accepts values when every required field is present", () => {
    expect(schemaToZod(schema, "document").safeParse(valid).success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const result = schemaToZod(schema, "document").safeParse({ area_m2: 750 });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only required string", () => {
    const result = schemaToZod(schema, "document").safeParse({
      ...valid,
      company_name: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("does not require optional fields", () => {
    const parsed = schemaToZod(schema, "document").safeParse(valid);
    expect(parsed.success && parsed.data.issue_date).toBeUndefined();
  });

  it("accepts a DD/MM/AAAA date", () => {
    const result = schemaToZod(schema, "document").safeParse({
      ...valid,
      issue_date: "05/10/2026",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an ISO date with the Portuguese format message", () => {
    const result = schemaToZod(schema, "document").safeParse({
      ...valid,
      issue_date: "2026-10-05",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Use o formato DD/MM/AAAA");
  });
});
