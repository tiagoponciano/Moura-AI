import { describe, expect, it } from "vitest";
import { NOT_AVAILABLE_REPLY, handleFloorPlansChat } from "./chat-handler";

const post = (body: string) =>
  new Request("http://localhost/api/floor-plans/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

describe("handleFloorPlansChat", () => {
  it("streams the not-available reply as an assistant text message", async () => {
    const response = await handleFloorPlansChat(
      post(JSON.stringify({ id: "chat", messages: [] })),
    );
    expect(response.status).toBe(200);
    const events = (await response.text())
      .split("\n")
      .filter((line) => line.startsWith("data: {"))
      .map((line) => JSON.parse(line.slice("data: ".length)));
    const text = events
      .filter((event) => event.type === "text-delta")
      .map((event) => event.delta)
      .join("");
    expect(text).toBe(NOT_AVAILABLE_REPLY);
  });

  it("rejects a body that is not JSON with 400", async () => {
    const response = await handleFloorPlansChat(post("not json"));
    expect(response.status).toBe(400);
  });
});
