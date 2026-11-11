import { describe, expect, it } from "vitest";
import { projectCreateSchema, projectUpdateSchema } from "./projects";

describe("projectCreateSchema", () => {
  it("trims the name", () => {
    expect(projectCreateSchema.parse({ name: " Padaria Silva " }).name).toBe(
      "Padaria Silva",
    );
  });

  it("refuses a blank name with the on-screen message", () => {
    const result = projectCreateSchema.safeParse({ name: "   " });
    expect(result.error?.issues[0]?.message).toBe("Informe o nome do projeto");
  });

  it("refuses a name over 120 characters", () => {
    expect(
      projectCreateSchema.safeParse({ name: "x".repeat(121) }).success,
    ).toBe(false);
  });
});

describe("projectUpdateSchema", () => {
  it("accepts known project fields", () => {
    expect(
      projectUpdateSchema.safeParse({ data: { owner_name: "Ana" } }).success,
    ).toBe(true);
  });

  it("accepts null to clear a field", () => {
    expect(
      projectUpdateSchema.safeParse({ data: { owner_name: null } }).success,
    ).toBe(true);
  });

  it("refuses a key the project does not share", () => {
    expect(
      projectUpdateSchema.safeParse({ data: { question: "x" } }).success,
    ).toBe(false);
  });
});
