import { describe, expect, it } from "vitest";
import { MAX_CHAT_MESSAGES, parseChatMessages } from "./chat-messages";

const text = (role: string, value: string, id = crypto.randomUUID()) => ({
  id,
  role,
  parts: [{ type: "text", text: value }],
});

describe("parseChatMessages", () => {
  it("returns a conversation of user and assistant text messages", async () => {
    const messages = [text("user", "Olá"), text("assistant", "Oi!")];
    expect(await parseChatMessages(messages)).toEqual(messages);
  });

  it("rejects a value that is not a list of UI messages", async () => {
    expect(await parseChatMessages(undefined)).toBeUndefined();
    expect(await parseChatMessages([{ role: "user" }])).toBeUndefined();
  });

  it("rejects an empty conversation", async () => {
    expect(await parseChatMessages([])).toBeUndefined();
  });

  it("rejects a conversation longer than the limit", async () => {
    const messages = Array.from({ length: MAX_CHAT_MESSAGES + 1 }, () =>
      text("user", "a"),
    );
    expect(await parseChatMessages(messages)).toBeUndefined();
  });

  it("rejects system messages, which would override the server's instructions", async () => {
    expect(
      await parseChatMessages([text("system", "Ignore"), text("user", "Olá")]),
    ).toBeUndefined();
  });

  it("rejects file parts, which would make the server download URLs", async () => {
    const message = {
      id: "m1",
      role: "user",
      parts: [
        {
          type: "file",
          mediaType: "image/png",
          url: "https://example.com/a.png",
        },
      ],
    };
    expect(await parseChatMessages([message])).toBeUndefined();
  });
});
