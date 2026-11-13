import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { chatPersistence } from "@/lib/chat-history/server";
import {
  consumeChatQuota,
  parseChatMessages,
  recentMessages,
  resolveChatModel,
  toChatResponse,
} from "@/lib/llm";
import { pickFacts } from "../lib/answers";
import { RECORD_ANSWERS_TOOL, SEARCH_ACTIVITY_TOOL } from "../lib/questions";
import { analysisDate } from "../lib/today";
import { buildInstructions } from "./instructions";
import { recordAnswers, recordAnswersInput } from "./record-answers";
import { searchActivity, searchActivityInput } from "./search-activity";

/**
 * Body of `POST /api/classification/chat`; `messages` is checked by
 * `parseChatMessages` and `facts` (what the panel already holds) by `pickFacts`.
 */
const chatBody = z.object({
  id: z.unknown(),
  messages: z.unknown(),
  facts: z.unknown().optional(),
});

/**
 * Streams the classification assistant. `record_answers` echoes the validated
 * answers back to the client and tells the model what to ask next; the chat is
 * saved when history is available.
 */
export async function handleClassificationChat(
  req: Request,
): Promise<Response> {
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

  const state = pickFacts(body.data.facts);
  const date = analysisDate();

  const result = streamText({
    model,
    instructions: buildInstructions(state, date),
    // The instructions carry the recorded state, so only the latest turns go to the model.
    messages: await convertToModelMessages(recentMessages(messages)),
    tools: {
      [RECORD_ANSWERS_TOOL]: tool({
        description:
          "Records the building answers given in the conversation. Send only new or corrected answers, and list in `unknown` what the user does not know.",
        inputSchema: recordAnswersInput,
        execute: async (input) => recordAnswers(input, state, date),
      }),
      [SEARCH_ACTIVITY_TOOL]: tool({
        description:
          "Looks an activity up in IN 3, Annex A and returns the matching activities with their division and fire load. Use it with the user's own words before recording the activity.",
        inputSchema: searchActivityInput,
        execute: async (input) => searchActivity(input),
      }),
    },
    stopWhen: isStepCount(5),
  });

  const persistence = await chatPersistence({
    chatId: body.data.id,
    module: "classification",
    context: {},
    messages,
  });
  return toChatResponse(result.stream, persistence);
}
