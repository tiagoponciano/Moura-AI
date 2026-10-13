import { describe, expect, it } from "vitest";
import {
  domainSchema,
  providerKeySchema,
  settingsUpdateSchema,
  userUpdateSchema,
} from "./validation";

describe("userUpdateSchema", () => {
  it("accepts status, role or both", () => {
    expect(userUpdateSchema.safeParse({ status: "approved" }).success).toBe(
      true,
    );
    expect(userUpdateSchema.safeParse({ role: "admin" }).success).toBe(true);
    expect(
      userUpdateSchema.safeParse({ status: "rejected", role: "member" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty body, unknown values and extra fields", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(false);
    expect(userUpdateSchema.safeParse({ status: "banned" }).success).toBe(
      false,
    );
    expect(
      userUpdateSchema.safeParse({ status: "approved", email: "x" }).success,
    ).toBe(false);
  });
});

describe("domainSchema", () => {
  it("normalizes case, spaces and a leading @", () => {
    expect(domainSchema.parse("  @Moura.COM ")).toBe("moura.com");
  });

  it("turns an empty value into null", () => {
    expect(domainSchema.parse("  ")).toBeNull();
  });

  it("rejects values that are not domains", () => {
    expect(domainSchema.safeParse("moura").success).toBe(false);
    expect(domainSchema.safeParse("ana@moura.com").success).toBe(false);
  });
});

describe("settingsUpdateSchema", () => {
  it("accepts a catalog model for its provider", () => {
    expect(
      settingsUpdateSchema.safeParse({
        llm: { provider: "google", model: "gemini-2.5-pro" },
      }).success,
    ).toBe(true);
  });

  it("rejects a model from another provider or outside the catalog", () => {
    expect(
      settingsUpdateSchema.safeParse({
        llm: { provider: "google", model: "gpt-5.5" },
      }).success,
    ).toBe(false);
    expect(
      settingsUpdateSchema.safeParse({
        llm: { provider: "openai", model: "gpt-0" },
      }).success,
    ).toBe(false);
  });

  it("accepts an empty domain to clear it", () => {
    expect(settingsUpdateSchema.parse({ allowedEmailDomain: "" })).toEqual({
      allowedEmailDomain: null,
    });
  });

  it("rejects clearing the model", () => {
    expect(settingsUpdateSchema.safeParse({ llm: null }).success).toBe(false);
  });

  it("rejects an empty body", () => {
    expect(settingsUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe("providerKeySchema", () => {
  it("trims the key and rejects a blank one", () => {
    expect(providerKeySchema.parse({ key: " sk-1 " })).toEqual({ key: "sk-1" });
    expect(providerKeySchema.safeParse({ key: "   " }).success).toBe(false);
  });
});
