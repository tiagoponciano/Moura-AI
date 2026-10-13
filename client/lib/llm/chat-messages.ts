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
