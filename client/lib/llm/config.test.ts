import { describe, expect, it } from "vitest";
import { DEFAULT_ANTHROPIC_MODEL, pickModelConfig } from "./config";

const stored = {
  provider: "openai",
  model: "gpt-5.5",
  api_key: "sk-db",
} as const;

describe("pickModelConfig", () => {
  it("uses the stored provider, model and key when all are present", () => {
    expect(pickModelConfig(stored, { ANTHROPIC_API_KEY: "sk-env" })).toEqual({
      provider: "openai",
      model: "gpt-5.5",
      apiKey: "sk-db",
    });
  });

  it("falls back to the environment when the stored provider has no key", () => {
    expect(
      pickModelConfig(
        { ...stored, api_key: null },
        { ANTHROPIC_API_KEY: "sk-env", LLM_MODEL: "claude-opus-5-5" },
      ),
    ).toEqual({
      provider: "anthropic",
      model: "claude-opus-5-5",
      apiKey: "sk-env",
    });
  });

  it("falls back to the environment without a stored config", () => {
    for (const none of [null, undefined]) {
      expect(pickModelConfig(none, { ANTHROPIC_API_KEY: "sk-env" })).toEqual({
        provider: "anthropic",
        model: DEFAULT_ANTHROPIC_MODEL,
        apiKey: "sk-env",
      });
    }
  });

  it("uses the default Anthropic model when LLM_MODEL is empty", () => {
    expect(
      pickModelConfig(null, { ANTHROPIC_API_KEY: "sk-env", LLM_MODEL: "" }),
    ).toMatchObject({ model: DEFAULT_ANTHROPIC_MODEL });
  });

  it("returns undefined when neither source has a key", () => {
    expect(pickModelConfig({ ...stored, api_key: "" }, {})).toBeUndefined();
    expect(pickModelConfig(null, { ANTHROPIC_API_KEY: "" })).toBeUndefined();
  });
});
