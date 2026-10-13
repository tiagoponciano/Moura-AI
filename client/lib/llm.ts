import { createAnthropic } from "@ai-sdk/anthropic";
import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";

const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatModel = ReturnType<ReturnType<typeof createAnthropic>>;

/**
 * Server-only. The Anthropic model configured by `LLM_MODEL` (default
 * `claude-sonnet-4-6`), or a 500 response when `ANTHROPIC_API_KEY` is unset.
 */
export function resolveChatModel():
  | { model: ChatModel; error?: undefined }
  | { model?: undefined; error: Response } {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      error: Response.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 },
      ),
    };
  }
  const anthropic = createAnthropic({ apiKey });
  return { model: anthropic(process.env.LLM_MODEL || DEFAULT_MODEL) };
}

/** Hooks that save the conversation once the response is complete (see `chatPersistence`). */
export type ChatPersistence = {
  originalMessages: UIMessage[];
  generateMessageId: () => string;
  onEnd: (event: { messages: UIMessage[] }) => Promise<void>;
};

/**
 * Wraps a model stream as an AI SDK UI message response; errors reach the
 * client unmasked. With `persistence`, the stream stays open until `onEnd`
 * has saved the messages.
 */
export function toChatResponse(
  stream: Parameters<typeof toUIMessageStream>[0]["stream"],
  persistence?: ChatPersistence,
): Response {
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream,
      ...persistence,
      onError: (error) =>
        error instanceof Error ? error.message : String(error),
    }),
  });
}
