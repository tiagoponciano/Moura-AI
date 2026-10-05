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
import { schemaToZod } from "@/features/documents/lib/schema-to-zod";
import {
  FILL_FIELDS_TOOL,
  type TemplateSchema,
} from "@/features/documents/lib/templates";

export const maxDuration = 60;

const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatRequest = {
  messages: UIMessage[];
  templateId: string;
  schema: TemplateSchema;
};

function buildInstructions(templateId: string, schema: TemplateSchema): string {
  const fields = schema.fields
    .map(
      (field) =>
        `- ${field.name} (${field.type}${field.required ? ", required" : ""}): ${field.description}`,
    )
    .join("\n");

  return `You are the assistant of Moura Soluções em Engenharia, a fire-prevention engineering firm in Santa Catarina, Brazil. You help the team fill in CBMSC (Corpo de Bombeiros Militar de Santa Catarina) forms from the conversation.

Current form: "${templateId}". Fields:
${fields}

Rules:
1. NEVER invent data. Use only information the user stated explicitly.
2. If information is missing, ask for it. A field that was not given stays empty — do not send it in the tool call.
3. Whenever the conversation brings new or corrected data, call the \`${FILL_FIELDS_TOOL}\` tool with only those fields.
4. Number fields are plain numbers without units. Dates use the DD/MM/AAAA format.
5. You do not generate the document: the user reviews the fields in the side panel and clicks "Gerar documento".
6. Always reply in Brazilian Portuguese, briefly and objectively. After filling, say what was recorded and which required fields are still missing.`;
}

export async function POST(req: Request) {
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
