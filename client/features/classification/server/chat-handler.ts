import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { chatPersistence } from "@/lib/chat-history/server";
import {
  consumeChatQuota,
  parseChatMessages,
  resolveChatModel,
  toChatResponse,
} from "@/lib/llm";
import { OCCUPANCY_IDS, RECORD_BUILDING_TOOL } from "../lib/building";
import { buildInstructions } from "./instructions";

const recordBuildingInput = z.object({
  area_m2: z
    .number()
    .positive()
    .optional()
    .describe("Total built area, in square meters"),
  height_m: z
    .number()
    .positive()
    .optional()
    .describe("Building height, in meters"),
  floor_count: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Number of floors"),
  occupancy: z.enum(OCCUPANCY_IDS).optional().describe("Occupancy id"),
});

/** Body of `POST /api/classification/chat`; `messages` is checked by `parseChatMessages`. */
const chatBody = z.object({ id: z.unknown(), messages: z.unknown() });

/**
 * Streams the classification assistant; `record_building` echoes the answers
 * back to the client. The chat is saved when history is available.
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

  const result = streamText({
    model,
    instructions: buildInstructions(),
    messages: await convertToModelMessages(messages),
    tools: {
      [RECORD_BUILDING_TOOL]: tool({
        description:
          "Records the building answers given in the conversation. Send only new or corrected answers.",
        inputSchema: recordBuildingInput,
        execute: async (answers) => answers,
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
