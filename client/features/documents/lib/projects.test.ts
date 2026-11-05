import { describe, expect, it } from "vitest";
import { projectCreateSchema } from "./projects";

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
