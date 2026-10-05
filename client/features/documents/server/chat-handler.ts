import {
  convertToModelMessages,
  isStepCount,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { resolveChatModel, toChatResponse } from "@/lib/llm";
import { schemaToZod } from "../lib/schema-to-zod";
import { FILL_FIELDS_TOOL, type TemplateSchema } from "../lib/templates";
import { buildInstructions } from "./instructions";

type ChatRequest = {
  messages: UIMessage[];
  templateId: string;
  schema: TemplateSchema;
};

/** Streams the documents assistant; the `fill_fields` tool echoes extracted values back to the client. */
export async function handleDocumentsChat(req: Request): Promise<Response> {
  const { model, error } = resolveChatModel();
  if (error) return error;

  const { messages, templateId, schema }: ChatRequest = await req.json();
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

  return toChatResponse(result.stream);
}
