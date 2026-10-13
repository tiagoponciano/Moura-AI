import { findCatalogProvider, type LlmProvider } from "@/lib/llm/catalog";
import type {
  AdminSettingsResponse,
  AdminUser,
  ProviderKeyHint,
} from "./types";
import { countByStatus } from "./users";

/** Why the chats cannot run, most fundamental first; see `getSetupProblem`. */
export type SetupProblem = "service_role" | "no_model" | "no_key";

/** The first thing stopping the chats, or `undefined` when they can run. */
export function getSetupProblem(
  data: AdminSettingsResponse,
): SetupProblem | undefined {
  if (!data.serviceRoleConfigured) return "service_role";
  const { provider, model } = data.settings;
  if (!provider || !model) return "no_model";
  if (!data.keys.some((key) => key.provider === provider)) return "no_key";
  return undefined;
}

export type SectionSummaries = {
  users: string;
  model: string;
  access: string;
};

const LOADING = "Carregando…";

/** The one-line state shown on each section tab (UI copy, so Portuguese). */
export function summarizeSections(
  users: AdminUser[] | undefined,
  data: AdminSettingsResponse | undefined,
): SectionSummaries {
  let usersSummary = LOADING;
  if (users) {
    const counts = countByStatus(users);
    usersSummary =
      counts.pending > 0
        ? `${counts.pending} aguardando aprovação`
        : `${counts.approved} com acesso`;
  }

  let model = LOADING;
  let access = LOADING;
  if (data) {
    const { provider, model: modelId, allowedEmailDomain } = data.settings;
    const entry = provider ? findCatalogProvider(provider) : undefined;
    model =
      entry && modelId
        ? `${entry.models.find((m) => m.id === modelId)?.label ?? modelId} · ${entry.label}`
        : "Nenhum modelo salvo";
    access = allowedEmailDomain
      ? `@${allowedEmailDomain}`
      : "Domínio do servidor";
  }

  return { users: usersSummary, model, access };
}

/** "Salvar modelo" needs a changed choice and a key for the chosen provider. */
export function canSaveModel({
  provider,
  model,
  saved,
  keys,
}: {
  provider: LlmProvider | undefined;
  model: string | undefined;
  saved: { provider: LlmProvider | null; model: string | null };
  keys: ProviderKeyHint[];
}): boolean {
  if (!provider || !model) return false;
  if (provider === saved.provider && model === saved.model) return false;
  return keys.some((key) => key.provider === provider);
}
