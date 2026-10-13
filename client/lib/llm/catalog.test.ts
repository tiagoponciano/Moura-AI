import { describe, expect, it } from "vitest";
import { LLM_CATALOG, LLM_PROVIDERS, isCatalogModel } from "./catalog";

describe("LLM_CATALOG", () => {
  it("lists every provider of the llm_provider enum once", () => {
    expect([...LLM_PROVIDERS].sort()).toEqual([
      "anthropic",
      "google",
      "openai",
    ]);
  });

  it("has unique model IDs within each provider", () => {
    for (const provider of LLM_CATALOG) {
      const ids = provider.models.map((model) => model.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThan(0);
    }
  });
});

describe("isCatalogModel", () => {
  it("accepts a model listed under its provider", () => {
    expect(isCatalogModel("openai", "gpt-5.5")).toBe(true);
  });

  it("rejects a model listed under another provider", () => {
    expect(isCatalogModel("google", "gpt-5.5")).toBe(false);
  });

  it("rejects unknown providers and models", () => {
    expect(isCatalogModel("mistral", "gpt-5.5")).toBe(false);
    expect(isCatalogModel("openai", "gpt-0")).toBe(false);
  });
});
