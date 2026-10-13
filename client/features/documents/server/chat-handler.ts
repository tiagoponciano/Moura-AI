import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { chatPersistence } from "@/lib/chat-history/server";
import { resolveChatModel, toChatResponse } from "@/lib/llm";
import { schemaToZod } from "../lib/schema-to-zod";
import { FILL_FIELDS_TOOL, type TemplateSchema } from "../lib/templates";
import { buildInstructions } from "./instructions";

type ChatRequest = {
  id: string;
  messages: UIMessage[];
  templateId: string;
  schema: TemplateSchema;
};

/**
 * Streams the documents assistant; the `fill_fields` tool echoes extracted
 * values back to the client. The chat is saved per template when history is available.
 */
export async function handleDocumentsChat(req: Request): Promise<Response> {
  const { model, error } = await resolveChatModel();
  if (error) return error;

  const { id, messages, templateId, schema }: ChatRequest = await req.json();
  if (!schema?.fields?.length) {
    return Response.json({ error: "Missing template schema" }, { status: 400 });
  }

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
