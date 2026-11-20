import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  consumeChatQuota: vi.fn(),
  parseChatMessages: vi.fn(),
  resolveChatModel: vi.fn(),
  toChatResponse: vi.fn(),
  streamText: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/llm", () => ({
  consumeChatQuota: mocks.consumeChatQuota,
  parseChatMessages: mocks.parseChatMessages,
  recentMessages: (messages: unknown) => messages,
  resolveChatModel: mocks.resolveChatModel,
  toChatResponse: mocks.toChatResponse,
}));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  streamText: mocks.streamText,
  convertToModelMessages: async () => [],
}));

import { handleNormsChat } from "./norms-chat-handler";

const post = (body: string) =>
  new Request("http://localhost/api/norms/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
const valid = JSON.stringify({ id: "c", messages: [] });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.parseChatMessages.mockResolvedValue([]);
  mocks.consumeChatQuota.mockResolvedValue(undefined);
  mocks.resolveChatModel.mockResolvedValue({ model: "model" });
  mocks.streamText.mockReturnValue({ stream: "stream" });
  mocks.toChatResponse.mockReturnValue(new Response("ok"));
});

describe("handleNormsChat", () => {
  it("rejects a body that is not JSON with 400", async () => {
    expect((await handleNormsChat(post("not json"))).status).toBe(400);
  });

  it("rejects messages that do not parse with 400, before spending any quota", async () => {
    mocks.parseChatMessages.mockResolvedValue(undefined);
    expect((await handleNormsChat(post(valid))).status).toBe(400);
    expect(mocks.consumeChatQuota).not.toHaveBeenCalled();
  });

  it("answers the quota error without reaching the model", async () => {
    mocks.consumeChatQuota.mockResolvedValue(
      Response.json({ error: "Limite" }, { status: 429 }),
    );
    expect((await handleNormsChat(post(valid))).status).toBe(429);
    expect(mocks.streamText).not.toHaveBeenCalled();
  });

  it("answers the missing-model error without reaching the model", async () => {
    mocks.resolveChatModel.mockResolvedValue({
      error: Response.json({ error: "sem modelo" }, { status: 500 }),
    });
    expect((await handleNormsChat(post(valid))).status).toBe(500);
    expect(mocks.streamText).not.toHaveBeenCalled();
  });

  it("gives the model the norm tools and the norms instructions, and nothing that fills a form or a classification", async () => {
    await handleNormsChat(post(valid));
    const call = mocks.streamText.mock.calls[0][0];
    expect(Object.keys(call.tools).sort()).toEqual([
      "read_norm_text",
      "search_norm",
    ]);
    expect(call.instructions).toContain("norms assistant");
  });

  it("does not save the conversation", async () => {
    await handleNormsChat(post(valid));
    expect(mocks.toChatResponse).toHaveBeenCalledWith("stream");
  });
});
