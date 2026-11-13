import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  MAX_CHAT_MESSAGES,
  parseChatMessages,
  RECENT_CHAT_MESSAGES,
  recentMessages,
} from "./chat-messages";

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

describe("recentMessages", () => {
  const turns = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      text(i % 2 === 0 ? "user" : "assistant", String(i), `m${i}`),
    ) as UIMessage[];
  const ids = (messages: UIMessage[]) => messages.map((m) => m.id);

  it("keeps a short conversation whole", () => {
    expect(ids(recentMessages(turns(3)))).toEqual(["m0", "m1", "m2"]);
  });

  it("keeps only the latest messages of a long one", () => {
    const all = turns(21);
    expect(recentMessages(all)).toHaveLength(RECENT_CHAT_MESSAGES - 1);
    expect(ids(recentMessages(all)).at(-1)).toBe("m20");
  });

  it("starts at a user message, never at an orphan assistant reply", () => {
    const all = turns(20);
    expect(recentMessages(all)[0].role).toBe("user");
  });

  it("falls back to the last user message when the tail has none", () => {
    const all = [
      text("user", "q", "u"),
      ...Array.from({ length: 8 }, (_, i) => text("assistant", "a", `a${i}`)),
    ] as UIMessage[];
    expect(ids(recentMessages(all))[0]).toBe("u");
  });
});
