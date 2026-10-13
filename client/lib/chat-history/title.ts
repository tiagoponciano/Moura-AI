import type { UIMessage } from "ai";

export const CHAT_TITLE_MAX_LENGTH = 80;

const FALLBACK_TITLE = "Nova conversa";

/** Title shown in the history list: the first user message, trimmed to one line. */
export function deriveChatTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const text = (firstUser?.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return FALLBACK_TITLE;
  if (text.length <= CHAT_TITLE_MAX_LENGTH) return text;
  return `${text.slice(0, CHAT_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}
