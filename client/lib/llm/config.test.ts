import { describe, expect, it } from "vitest";
import { pickModelConfig } from "./config";

const stored = {
  provider: "openai",
  model: "gpt-5.5",
  api_key: "sk-db",
} as const;

describe("pickModelConfig", () => {
  it("uses the stored provider, model and key", () => {
    expect(pickModelConfig(stored)).toEqual({
      provider: "openai",
      model: "gpt-5.5",
      apiKey: "sk-db",
    });
  });

  it("returns undefined when the stored provider has no key", () => {
    expect(pickModelConfig({ ...stored, api_key: null })).toBeUndefined();
    expect(pickModelConfig({ ...stored, api_key: "" })).toBeUndefined();
  });

  it("returns undefined without a stored config", () => {
    expect(pickModelConfig(null)).toBeUndefined();
    expect(pickModelConfig(undefined)).toBeUndefined();
  });
});
