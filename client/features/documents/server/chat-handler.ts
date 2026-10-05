import { createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  tool,
  type UIMessage,
} from "ai";
import { schemaToZod } from "../lib/schema-to-zod";
import { FILL_FIELDS_TOOL, type TemplateSchema } from "../lib/templates";
import { buildInstructions } from "./instructions";

const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatRequest = {
  messages: UIMessage[];
  templateId: string;
  schema: TemplateSchema;
};

/** Streams the documents assistant; the `fill_fields` tool echoes extracted values back to the client. */
export async function handleDocumentsChat(req: Request): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const { messages, templateId, schema }: ChatRequest = await req.json();
  if (!schema?.fields?.length) {
    return Response.json({ error: "Missing template schema" }, { status: 400 });
  }

  const anthropic = createAnthropic({ apiKey });

  const result = streamText({
    model: anthropic(process.env.LLM_MODEL || DEFAULT_MODEL),
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

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) =>
        error instanceof Error ? error.message : String(error),
    }),
  });
}
