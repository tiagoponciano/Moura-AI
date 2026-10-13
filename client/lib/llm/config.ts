import type { LlmProvider } from "./catalog";

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";

export type ModelConfig = {
  provider: LlmProvider;
  model: string;
  apiKey: string;
};

/** A row of `get_llm_config()`. */
export type StoredModelConfig = {
  provider: LlmProvider;
  model: string;
  api_key: string | null;
};

type ModelEnv = { ANTHROPIC_API_KEY?: string; LLM_MODEL?: string };

/**
 * Which model the chat routes use: the admin console's choice when its
 * provider has a key, else Anthropic from the environment, else none.
 */
export function pickModelConfig(
  stored: StoredModelConfig | null | undefined,
  env: ModelEnv,
): ModelConfig | undefined {
  if (stored?.api_key) {
    return {
      provider: stored.provider,
      model: stored.model,
      apiKey: stored.api_key,
    };
  }
  if (env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: env.LLM_MODEL || DEFAULT_ANTHROPIC_MODEL,
      apiKey: env.ANTHROPIC_API_KEY,
    };
  }
  return undefined;
}
