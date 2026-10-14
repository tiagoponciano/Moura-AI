import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";

/** Shown as the assistant's reply until the conversion agent exists. */
export const NOT_AVAILABLE_REPLY =
  "A conversão de plantas para DWG ainda está em preparação. Você já pode enviar o PDF ao lado para visualizá-lo; a leitura de escala e camadas e a geração do DWG chegam assim que os critérios forem definidos com a Moura.";

/** Body of `POST /api/floor-plans/chat`, the same shape the other chats send. */
const chatBody = z.object({ id: z.unknown(), messages: z.unknown() });

/**
 * Streams a fixed reply in the AI SDK message format, so the chat UI works
 * unchanged. No model is called and nothing is saved.
 */
export async function handleFloorPlansChat(req: Request): Promise<Response> {
  const body = await parseJsonBody(req, chatBody);
  if (body.error) return body.error;

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "text-start", id: "reply" });
      writer.write({
        type: "text-delta",
        id: "reply",
        delta: NOT_AVAILABLE_REPLY,
      });
      writer.write({ type: "text-end", id: "reply" });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
