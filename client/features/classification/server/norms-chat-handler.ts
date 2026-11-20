import { convertToModelMessages, isStepCount, streamText } from "ai";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import {
  consumeChatQuota,
  parseChatMessages,
  recentMessages,
  resolveChatModel,
  toChatResponse,
} from "@/lib/llm";
import { buildNormsInstructions } from "./norms-instructions";
import { normSearchTools } from "./search-norm";

/** Body of `POST /api/norms/chat`; `messages` is checked by `parseChatMessages`. */
const chatBody = z.object({ id: z.unknown(), messages: z.unknown() });

/**
 * Streams the norms assistant: it searches and reads the text of the CBMSC
 * instructions with `search_norm` and `read_norm_text` and answers from it. The
 * conversation is not saved: it has no module in the chat history yet.
 */
export async function handleNormsChat(req: Request): Promise<Response> {
  const body = await parseJsonBody(req, chatBody);
  if (body.error) return body.error;
  const messages = await parseChatMessages(body.data.messages);
  if (!messages) {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }

  const quotaError = await consumeChatQuota();
  if (quotaError) return quotaError;
  const { model, error } = await resolveChatModel();
  if (error) return error;

  const result = streamText({
    model,
    instructions: buildNormsInstructions(),
    // A norm question rarely needs more than the latest turns.
    messages: await convertToModelMessages(recentMessages(messages)),
    tools: normSearchTools,
    stopWhen: isStepCount(8),
  });
  return toChatResponse(result.stream);
}
