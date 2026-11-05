import { describe, expect, it } from "vitest";
import { generateRequestBody } from "./generate-request";

const body = { templateId: "in-1-anexo-d", format: "pdf", values: {} };

describe("generateRequestBody", () => {
  it("accepts scalar values", () => {
    const values = { a: "x", b: 1, c: true };
    expect(generateRequestBody.safeParse({ ...body, values }).success).toBe(
      true,
    );
  });

  it("refuses a template id that could leave the templates folder", () => {
    expect(
      generateRequestBody.safeParse({ ...body, templateId: "../secret" })
        .success,
    ).toBe(false);
  });

  it("refuses other formats and nested values", () => {
    expect(
      generateRequestBody.safeParse({ ...body, format: "exe" }).success,
    ).toBe(false);
    expect(
      generateRequestBody.safeParse({ ...body, values: { a: {} } }).success,
    ).toBe(false);
  });
});
