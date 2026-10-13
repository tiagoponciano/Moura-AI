import { afterEach, describe, expect, it, vi } from "vitest";
import { errorMessage, requestJson } from "./request-json";

function respondWith(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestJson", () => {
  it("resolves to the JSON body of a 2xx response", async () => {
    respondWith(Response.json({ chats: [] }));
    await expect(requestJson("/api/chats")).resolves.toEqual({ chats: [] });
  });

  it("resolves to undefined for a 204 response", async () => {
    respondWith(new Response(null, { status: 204 }));
    await expect(requestJson("/api/admin/settings")).resolves.toBeUndefined();
  });

  it("throws with the server's error field when the response is not 2xx", async () => {
    respondWith(Response.json({ error: "Admin only" }, { status: 403 }));
    await expect(requestJson("/api/admin/users")).rejects.toThrow("Admin only");
  });

  it("throws with the status when the error body is not JSON", async () => {
    respondWith(new Response("Bad gateway", { status: 502 }));
    await expect(requestJson("/api/chats")).rejects.toThrow(
      "Request failed with 502",
    );
  });

  it("sends a JSON content type only when there is a body", async () => {
    const fetchMock = respondWith(new Response(null, { status: 204 }));
    await requestJson("/api/x", { method: "PUT", body: "{}" });
    await requestJson("/api/x");
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      "Content-Type": "application/json",
    });
    expect(fetchMock.mock.calls[1][1].headers).toBeUndefined();
  });
});

describe("errorMessage", () => {
  it("uses the message of an Error", () => {
    expect(errorMessage(new Error("Falhou"))).toBe("Falhou");
  });

  it("stringifies anything else", () => {
    expect(errorMessage("offline")).toBe("offline");
  });
});
