import type { LlmProvider } from "./catalog";

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

/**
 * The model the chat routes use: the admin console's choice, or `undefined`
 * when nothing is saved or the saved provider has no key.
 */
export function pickModelConfig(
  stored: StoredModelConfig | null | undefined,
): ModelConfig | undefined {
  if (!stored?.api_key) return undefined;
  return {
    provider: stored.provider,
    model: stored.model,
    apiKey: stored.api_key,
  };
}
