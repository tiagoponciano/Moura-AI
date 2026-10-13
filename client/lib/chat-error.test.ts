import { describe, expect, it } from "vitest";
import { chatErrorMessage } from "./chat-error";

describe("chatErrorMessage", () => {
  it("shows the error field of a JSON error body", () => {
    expect(
      chatErrorMessage(
        new Error('{"error":"Nenhum modelo de IA configurado."}'),
      ),
    ).toBe("Nenhum modelo de IA configurado.");
  });

  it("shows plain messages unchanged", () => {
    expect(chatErrorMessage(new Error("invalid x-api-key"))).toBe(
      "invalid x-api-key",
    );
  });

  it("shows JSON without a string error field unchanged", () => {
    expect(chatErrorMessage(new Error('{"message":"quota"}'))).toBe(
      '{"message":"quota"}',
    );
    expect(chatErrorMessage(new Error("null"))).toBe("null");
  });
});
