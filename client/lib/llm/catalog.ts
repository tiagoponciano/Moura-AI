import type { Database } from "@/lib/supabase/database.types";

export type LlmProvider = Database["public"]["Enums"]["llm_provider"];

export type CatalogModel = { id: string; label: string };

export type CatalogProvider = {
  id: LlmProvider;
  label: string;
  models: CatalogModel[];
};

/**
 * The models the admin console offers. IDs are passed verbatim to the
 * provider's AI SDK package; add one here to make it selectable.
 */
export const LLM_CATALOG: CatalogProvider[] = [
  {
    id: "anthropic",
    label: "Anthropic",
    models: [
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
      { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    models: [
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
    ],
  },
  {
    id: "google",
    label: "Google",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (preview)" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },
];

export const LLM_PROVIDERS = LLM_CATALOG.map((provider) => provider.id) as [
  LlmProvider,
  ...LlmProvider[],
];

export function findCatalogProvider(
  provider: string,
): CatalogProvider | undefined {
  return LLM_CATALOG.find((entry) => entry.id === provider);
}

export function isCatalogModel(provider: string, model: string): boolean {
  return (
    findCatalogProvider(provider)?.models.some((entry) => entry.id === model) ??
    false
  );
}
