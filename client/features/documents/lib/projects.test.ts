import { describe, expect, it } from "vitest";
import { projectUpdateSchema } from "./projects";

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

  it("accepts a new name alone", () => {
    expect(projectUpdateSchema.safeParse({ name: "Padaria" }).success).toBe(
      true,
    );
  });

  it("refuses a body with neither a name nor data", () => {
    expect(projectUpdateSchema.safeParse({}).success).toBe(false);
  });
});
