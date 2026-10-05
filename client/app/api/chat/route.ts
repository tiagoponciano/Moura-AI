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
import { schemaToZod } from "@/lib/documents/schema-to-zod";
import type { TemplateSchema } from "@/lib/documents/templates";

export const maxDuration = 60;

const DEFAULT_MODEL = "claude-sonnet-4-6";

type ChatRequest = {
  messages: UIMessage[];
  templateId: string;
  schema: TemplateSchema;
};

function buildInstructions(templateId: string, schema: TemplateSchema): string {
  const fields = schema.campos
    .map(
      (field) =>
        `- ${field.nome} (${field.tipo}${field.obrigatorio ? ", obrigatório" : ""}): ${field.descricao}`,
    )
    .join("\n");

  return `Você é o assistente da Moura Soluções em Engenharia, empresa de projetos de prevenção contra incêndio em Santa Catarina. Sua função é ajudar a equipe a preencher formulários do CBMSC (Corpo de Bombeiros Militar de Santa Catarina) a partir da conversa.

Formulário atual: "${templateId}". Campos:
${fields}

Regras:
1. NUNCA invente dados. Use apenas informações ditas explicitamente pelo usuário.
2. Se faltar informação, pergunte. Campo não informado fica vazio — não o envie na tool.
3. Sempre que a conversa trouxer dados novos ou corrigidos, chame a tool \`preencher_campos\` apenas com esses campos.
4. Números (campos number) vão como número puro, sem unidade. Datas vão no formato DD/MM/AAAA.
5. Você não gera o documento: o usuário revisa os campos no painel ao lado e clica em "Gerar documento".
6. Responda em português, de forma curta e objetiva. Depois de preencher, diga o que foi registrado e quais campos obrigatórios ainda faltam.`;
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
  if (!schema?.campos?.length) {
    return Response.json({ error: "Missing template schema" }, { status: 400 });
  }

  const anthropic = createAnthropic({ apiKey });

  const result = streamText({
    model: anthropic(process.env.LLM_MODEL || DEFAULT_MODEL),
    instructions: buildInstructions(templateId, schema),
    messages: await convertToModelMessages(messages),
    tools: {
      preencher_campos: tool({
        description:
          "Registra no formulário os campos extraídos da conversa. Envie apenas os campos com dados novos ou corrigidos.",
        inputSchema: schemaToZod(schema, "extraction"),
        execute: async (campos) => campos,
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
