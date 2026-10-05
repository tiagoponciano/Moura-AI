import { createAnthropic } from "@ai-sdk/anthropic";
import { createUIMessageStreamResponse, toUIMessageStream } from "ai";

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

/** Wraps a model stream as an AI SDK UI message response; errors reach the client unmasked. */
export function toChatResponse(
  stream: Parameters<typeof toUIMessageStream>[0]["stream"],
): Response {
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream,
      onError: (error) =>
        error instanceof Error ? error.message : String(error),
    }),
  });
}
