import type { UIMessage } from "ai";
import { requestJson } from "@/lib/api/request-json";
import type { ChatContext, ChatModule, ChatSummary } from "./types";

export async function fetchChats(
  module: ChatModule,
  context: ChatContext = {},
): Promise<ChatSummary[]> {
  const params = new URLSearchParams({
    module,
    context: JSON.stringify(context),
  });
  const { chats } = await requestJson<{ chats: ChatSummary[] }>(
    `/api/chats?${params}`,
  );
  return chats;
}

export async function fetchChatMessages(id: string): Promise<UIMessage[]> {
  const { messages } = await requestJson<{ messages: UIMessage[] }>(
    `/api/chats/${id}`,
  );
  return messages;
}
