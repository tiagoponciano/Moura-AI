import { describe, expect, it } from "vitest";
import { projectCreateSchema, projectIdSchema } from "./projects";

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

describe("projectIdSchema", () => {
  it("accepts a uuid", () => {
    expect(
      projectIdSchema.safeParse("3f2c1a9e-8b7d-4c6e-9a10-5d4e3f2a1b0c").success,
    ).toBe(true);
  });

  it("refuses an id that is not a uuid", () => {
    expect(projectIdSchema.safeParse("1; drop table projects").success).toBe(
      false,
    );
  });
});
