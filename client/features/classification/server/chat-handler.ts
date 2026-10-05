import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { resolveChatModel, toChatResponse } from "@/lib/llm";
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

/** Streams the classification assistant; `record_building` echoes the answers back to the client. */
export async function handleClassificationChat(
  req: Request,
): Promise<Response> {
  const { model, error } = resolveChatModel();
  if (error) return error;

  const { messages }: { messages: UIMessage[] } = await req.json();

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

  return toChatResponse(result.stream);
}
