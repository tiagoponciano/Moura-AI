import { describe, expect, it } from "vitest";
import {
  domainSchema,
  formDraftSchema,
  formUpdateSchema,
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

describe("formDraftSchema", () => {
  const valid = {
    googleDocId: "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
    normative: 1,
    annex: " d ",
    name: " Formulário ",
  };

  it("trims the name and upper-cases the annex", () => {
    expect(formDraftSchema.parse(valid)).toMatchObject({
      annex: "D",
      name: "Formulário",
    });
  });

  it("rejects an annex with digits", () => {
    expect(formDraftSchema.safeParse({ ...valid, annex: "D1" }).success).toBe(
      false,
    );
  });

  it("rejects IN zero with the on-screen message", () => {
    const result = formDraftSchema.safeParse({ ...valid, normative: 0 });
    expect(result.error?.issues[0]?.message).toBe("Informe o número da IN");
  });
});

describe("formUpdateSchema", () => {
  it("accepts a single field", () => {
    expect(formUpdateSchema.safeParse({ active: false }).success).toBe(true);
    expect(formUpdateSchema.parse({ annex: " e " })).toEqual({ annex: "E" });
  });

  it("rejects an empty body and unknown fields", () => {
    expect(formUpdateSchema.safeParse({}).success).toBe(false);
    expect(formUpdateSchema.safeParse({ created_at: "x" }).success).toBe(false);
  });

  it("rejects a link in place of a Google Doc id", () => {
    const result = formUpdateSchema.safeParse({
      googleDocId: "https://docs.google.com/document/d/x",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Link do Google Docs inválido",
    );
  });
});
