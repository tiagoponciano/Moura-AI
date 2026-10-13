import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { CHAT_TITLE_MAX_LENGTH, deriveChatTitle } from "./title";

const message = (role: UIMessage["role"], ...texts: string[]): UIMessage => ({
  id: `${role}-${texts.join("")}`,
  role,
  parts: texts.map((text) => ({ type: "text", text })),
});

describe("deriveChatTitle", () => {
  it("uses the first user message", () => {
    expect(
      deriveChatTitle([
        message("user", "Padaria Silva, 750 m²"),
        message("assistant", "Anotado."),
        message("user", "Outra coisa"),
      ]),
    ).toBe("Padaria Silva, 750 m²");
  });

  it("joins the text parts and collapses whitespace", () => {
    expect(
      deriveChatTitle([message("user", "  Loja \n de ", "  roupas  ")]),
    ).toBe("Loja de roupas");
  });

  it("cuts long titles and marks the cut with an ellipsis", () => {
    const title = deriveChatTitle([message("user", "a".repeat(200))]);
    expect(title).toHaveLength(CHAT_TITLE_MAX_LENGTH);
    expect(title.endsWith("…")).toBe(true);
  });

  it("falls back to a default when no user text exists", () => {
    expect(deriveChatTitle([message("assistant", "Olá")])).toBe(
      "Nova conversa",
    );
    expect(deriveChatTitle([message("user", "   ")])).toBe("Nova conversa");
  });
});
