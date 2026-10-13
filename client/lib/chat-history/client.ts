import type { UIMessage } from "ai";
import type { ChatContext, ChatModule, ChatSummary } from "./types";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }
  return response.json();
}

export async function fetchChats(
  module: ChatModule,
  context: ChatContext = {},
): Promise<ChatSummary[]> {
  const params = new URLSearchParams({
    module,
    context: JSON.stringify(context),
  });
  const { chats } = await getJson<{ chats: ChatSummary[] }>(
    `/api/chats?${params}`,
  );
  return chats;
}

export async function fetchChatMessages(id: string): Promise<UIMessage[]> {
  const { messages } = await getJson<{ messages: UIMessage[] }>(
    `/api/chats/${id}`,
  );
  return messages;
}
