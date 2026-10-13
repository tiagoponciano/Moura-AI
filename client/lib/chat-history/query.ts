import { z } from "zod";
import { CHAT_MODULES, type ChatContext, type ChatModule } from "./types";

const listQuery = z.object({
  module: z.enum(CHAT_MODULES),
  context: z.record(z.string(), z.string()),
});

/** `GET /api/chats?module=<module>&context=<JSON>`; `undefined` when invalid. */
export function parseChatListQuery(
  params: URLSearchParams,
): { module: ChatModule; context: ChatContext } | undefined {
  let context: unknown = {};
  const rawContext = params.get("context");
  if (rawContext) {
    try {
      context = JSON.parse(rawContext);
    } catch {
      return undefined;
    }
  }
  const parsed = listQuery.safeParse({ module: params.get("module"), context });
  return parsed.success ? parsed.data : undefined;
}

export function isChatId(value: unknown): value is string {
  return z.uuid().safeParse(value).success;
}
