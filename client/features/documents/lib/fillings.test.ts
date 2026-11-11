import { describe, expect, it } from "vitest";
import { definedValues, fillingBody, templateIdSchema } from "./fillings";

describe("fillingBody", () => {
  it("accepts text, number and boolean values", () => {
    expect(
      fillingBody.safeParse({ values: { a: "x", b_1: 2, c: false } }).success,
    ).toBe(true);
  });

  it("refuses a field name that is not an identifier", () => {
    expect(fillingBody.safeParse({ values: { "a b": "x" } }).success).toBe(
      false,
    );
  });

  it("refuses nested values", () => {
    expect(fillingBody.safeParse({ values: { a: { b: 1 } } }).success).toBe(
      false,
    );
  });

  it("refuses unknown keys in the body", () => {
    expect(fillingBody.safeParse({ values: {}, other: 1 }).success).toBe(false);
  });
});

describe("templateIdSchema", () => {
  it("accepts a catalog template id", () => {
    expect(templateIdSchema.safeParse("in-1-anexo-d").success).toBe(true);
  });

  it("refuses a path-like id", () => {
    expect(templateIdSchema.safeParse("../x").success).toBe(false);
  });
});

it("drops unset values before saving", () => {
  expect(definedValues({ a: "x", b: undefined })).toEqual({ a: "x" });
});
