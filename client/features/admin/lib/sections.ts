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

/** The provider and model picked in the panel, next to what is saved. */
export type ModelChoice = {
  provider: LlmProvider | undefined;
  model: string | undefined;
  saved: { provider: LlmProvider | null; model: string | null };
  keys: ProviderKeyHint[];
};

const isUnchanged = ({ provider, model, saved }: ModelChoice) =>
  (provider ?? null) === saved.provider && (model ?? null) === saved.model;

const hasKey = ({ provider, keys }: ModelChoice) =>
  keys.some((key) => key.provider === provider);

/** "Salvar modelo" needs a changed choice and a key for the chosen provider. */
export function canSaveModel(choice: ModelChoice): boolean {
  if (!choice.provider || !choice.model) return false;
  return !isUnchanged(choice) && hasKey(choice);
}

/** The model panel's footer line when no save has just happened. */
export function describeModelChoice(choice: ModelChoice): {
  text: string;
  tone: "muted" | "warning";
} {
  const { provider, saved } = choice;
  if (isUnchanged(choice)) {
    const entry = saved.provider
      ? findCatalogProvider(saved.provider)
      : undefined;
    const label = entry?.models.find((m) => m.id === saved.model)?.label;
    return {
      text: saved.model
        ? `Em uso: ${label ?? saved.model}.`
        : "Nenhum modelo salvo.",
      tone: "muted",
    };
  }
  if (provider && !hasKey(choice)) {
    return {
      text: `Cadastre a chave da ${findCatalogProvider(provider)?.label ?? provider} para usar este provedor.`,
      tone: "warning",
    };
  }
  return { text: "Alterações não salvas.", tone: "muted" };
}
