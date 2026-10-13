import "server-only";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  pickModelConfig,
  type ModelConfig,
  type StoredModelConfig,
} from "./config";

export { MAX_CHAT_MESSAGES, parseChatMessages } from "./chat-messages";

/** The admin console's choice, or `undefined` when it cannot be read. */
async function readStoredModelConfig(): Promise<StoredModelConfig | undefined> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.rpc("get_llm_config").maybeSingle();
  if (error) {
    console.error("Failed to read the LLM config", error);
    return undefined;
  }
  return data ?? undefined;
}

function createModel({ provider, model, apiKey }: ModelConfig): LanguageModel {
  switch (provider) {
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "google":
      return createGoogle({ apiKey })(model);
  }
}

/** Shown in the chat, so it is in Portuguese. */
const NOT_CONFIGURED_MESSAGE =
  "Nenhum modelo de IA configurado. Peça a um administrador para configurar em Administração.";

/**
 * Server-only. The model chosen in the admin console, or a 500 response with
 * `NOT_CONFIGURED_MESSAGE` when none can be used (see `pickModelConfig`).
 */
export async function resolveChatModel(): Promise<
  | { model: LanguageModel; error?: undefined }
  | { model?: undefined; error: Response }
> {
  const config = pickModelConfig(await readStoredModelConfig());
  if (!config) {
    return {
      error: Response.json({ error: NOT_CONFIGURED_MESSAGE }, { status: 500 }),
    };
  }
  return { model: createModel(config) };
}

/** Shown in the chat, so it is in Portuguese. */
const RATE_LIMITED_MESSAGE =
  "Limite de mensagens atingido. Aguarde um minuto e tente novamente.";

/**
 * Server-only. Counts one request against the signed-in user's quota (see the
 * chat rate limit migration). A 401/503 without a session or Supabase, 429
 * when the quota is used up, 500 when it cannot be checked: the model is never
 * reached without a successful check.
 */
export async function consumeChatQuota(): Promise<Response | undefined> {
  const auth = await requireUser(NOT_CONFIGURED_MESSAGE);
  if (auth.error) return auth.error;

  const { data: allowed, error } = await auth.supabase.rpc(
    "consume_chat_request",
  );
  if (error) {
    console.error("Failed to check the chat quota", error);
    return Response.json(
      { error: "Failed to check the chat quota" },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }
  if (!allowed) {
    return Response.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
  }
  return undefined;
}

/** Hooks that save the conversation once the response is complete (see `chatPersistence`). */
export type ChatPersistence = {
  originalMessages: UIMessage[];
  generateMessageId: () => string;
  onEnd: (event: { messages: UIMessage[] }) => Promise<void>;
};

/** Shown in the chat, so it is in Portuguese. */
const STREAM_ERROR_MESSAGE =
  "Não foi possível obter a resposta do assistente. Tente novamente.";

/**
 * Wraps a model stream as an AI SDK UI message response. Provider errors are
 * logged and reach the client only as `STREAM_ERROR_MESSAGE`, since they can
 * carry request details. With `persistence`, the stream stays open until
 * `onEnd` has saved the messages.
 */
export function toChatResponse(
  stream: Parameters<typeof toUIMessageStream>[0]["stream"],
  persistence?: ChatPersistence,
): Response {
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream,
      ...persistence,
      onError: (error) => {
        console.error("Chat stream failed", error);
        return STREAM_ERROR_MESSAGE;
      },
    }),
  });
}
