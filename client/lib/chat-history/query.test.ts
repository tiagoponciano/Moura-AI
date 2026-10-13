import { describe, expect, it } from "vitest";
import { isChatId, parseChatListQuery } from "./query";

const params = (entries: Record<string, string>) =>
  new URLSearchParams(entries);

describe("parseChatListQuery", () => {
  it("reads the module and defaults the context to empty", () => {
    expect(parseChatListQuery(params({ module: "classification" }))).toEqual({
      module: "classification",
      context: {},
    });
  });

  it("reads the context as a JSON object of strings", () => {
    expect(
      parseChatListQuery(
        params({ module: "documents", context: '{"templateId":"example"}' }),
      ),
    ).toEqual({ module: "documents", context: { templateId: "example" } });
  });

  it("rejects an unknown or missing module", () => {
    expect(
      parseChatListQuery(params({ module: "floor-plans" })),
    ).toBeUndefined();
    expect(parseChatListQuery(params({}))).toBeUndefined();
  });

  it("rejects a context that is not valid JSON or not flat strings", () => {
    expect(
      parseChatListQuery(params({ module: "documents", context: "{oops" })),
    ).toBeUndefined();
    expect(
      parseChatListQuery(params({ module: "documents", context: '{"a":1}' })),
    ).toBeUndefined();
  });
});

describe("isChatId", () => {
  it("accepts a UUID such as crypto.randomUUID() returns", () => {
    expect(isChatId("3b241101-e2bb-4255-8caf-4136c566a962")).toBe(true);
  });

  it("rejects the short ids useChat generates by default", () => {
    expect(isChatId("aBc123XyZ")).toBe(false);
    expect(isChatId(undefined)).toBe(false);
  });
});
