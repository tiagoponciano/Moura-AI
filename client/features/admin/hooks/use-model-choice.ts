"use client";

import { useState } from "react";
import { findCatalogProvider, type LlmProvider } from "@/lib/llm/catalog";
import type { AdminSettingsResponse } from "../lib/types";

/** The provider and model being picked in the console, starting from what is saved. */
export function useModelChoice(data: AdminSettingsResponse) {
  const saved = data.settings;
  const [provider, setProvider] = useState<LlmProvider | undefined>(
    saved.provider ?? undefined,
  );
  const [model, setModel] = useState<string | undefined>(
    saved.model ?? undefined,
  );

  /** Picking a provider selects its saved model, or else its first one. */
  function selectProvider(next: LlmProvider) {
    setProvider(next);
    setModel(
      next === saved.provider && saved.model
        ? saved.model
        : findCatalogProvider(next)?.models[0]?.id,
    );
  }

  function discard() {
    setProvider(saved.provider ?? undefined);
    setModel(saved.model ?? undefined);
  }

  return {
    provider,
    model,
    setModel,
    selectProvider,
    discard,
    unchanged:
      provider === (saved.provider ?? undefined) &&
      model === (saved.model ?? undefined),
    choice: { provider, model, saved, keys: data.keys },
  };
}
