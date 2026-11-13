import { safeValidateUIMessages, type UIMessage } from "ai";

/** Longest conversation a chat route accepts; longer ones start a new chat. */
export const MAX_CHAT_MESSAGES = 200;

/**
 * The conversation the browser sent, or `undefined` when it is not one our
 * chat UI produces: a list of user and assistant messages without file parts.
 * System messages would override the server's instructions; file parts would
 * make the server download whatever URL they point at.
 */
export async function parseChatMessages(
  value: unknown,
): Promise<UIMessage[] | undefined> {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_CHAT_MESSAGES
  ) {
    return undefined;
  }
  const result = await safeValidateUIMessages({ messages: value });
  if (!result.success) return undefined;

  const allowed = result.data.every(
    (message) =>
      message.role !== "system" &&
      message.parts.every((part) => part.type !== "file"),
  );
  return allowed ? result.data : undefined;
}

/** How many recent messages a state-backed chat sends to the model. */
export const RECENT_CHAT_MESSAGES = 6;

/**
 * The last `limit` messages, starting at a user message. For chats whose
 * instructions already carry everything recorded so far (the panel's answers),
 * the model does not need the whole history, which grows the tokens of every turn.
 * The saved conversation is not trimmed.
 */
export function recentMessages(
  messages: UIMessage[],
  limit = RECENT_CHAT_MESSAGES,
): UIMessage[] {
  const tail = messages.slice(-limit);
  const firstUser = tail.findIndex((message) => message.role === "user");
  if (firstUser >= 0) return tail.slice(firstUser);
  const lastUser = messages.findLastIndex((message) => message.role === "user");
  return lastUser >= 0 ? messages.slice(lastUser) : tail;
}
