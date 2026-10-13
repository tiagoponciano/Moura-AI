import { convertToModelMessages, isStepCount, streamText, tool } from "ai";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { chatPersistence } from "@/lib/chat-history/server";
import {
  consumeChatQuota,
  parseChatMessages,
  resolveChatModel,
  toChatResponse,
} from "@/lib/llm";
import { documentsChatBody } from "../lib/chat-request";
import { schemaToZod } from "../lib/schema-to-zod";
import { FILL_FIELDS_TOOL } from "../lib/templates";
import { buildInstructions } from "./instructions";

/**
 * Streams the documents assistant; the `fill_fields` tool echoes extracted
 * values back to the client. The chat is saved per template when history is available.
 */
export async function handleDocumentsChat(req: Request): Promise<Response> {
  const body = await parseJsonBody(req, documentsChatBody);
  if (body.error) return body.error;
  const { id, templateId, schema } = body.data;
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
    instructions: buildInstructions(templateId, schema),
    messages: await convertToModelMessages(messages),
    tools: {
      [FILL_FIELDS_TOOL]: tool({
        description:
          "Records the fields extracted from the conversation in the form. Send only fields with new or corrected data.",
        inputSchema: schemaToZod(schema, "extraction"),
        execute: async (fields) => fields,
      }),
    },
    stopWhen: isStepCount(5),
  });

  const persistence = await chatPersistence({
    chatId: id,
    module: "documents",
    context: { templateId },
    messages,
  });
  return toChatResponse(result.stream, persistence);
}
