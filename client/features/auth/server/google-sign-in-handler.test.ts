import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient }));

import { handleGoogleSignIn } from "./google-sign-in-handler";

const signInWithIdToken = vi.fn();
const fetchMock = vi.fn();

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/auth/google", {
    method: "POST",
    headers: { "x-requested-with": "XMLHttpRequest", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-id");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  createSupabaseServerClient.mockResolvedValue({
    auth: { signInWithIdToken },
  });
  signInWithIdToken.mockResolvedValue({ error: null });
  fetchMock.mockResolvedValue(
    Response.json({ id_token: "google-id-token" }, { status: 200 }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe("handleGoogleSignIn", () => {
  it("rejects a request without the X-Requested-With header", async () => {
    const response = await handleGoogleSignIn(
      new Request("http://localhost/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ code: "c" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 503 when the client secret is missing", async () => {
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect((await handleGoogleSignIn(request({ code: "c" }))).status).toBe(503);
  });

  it("answers 503 when Supabase is not configured", async () => {
    createSupabaseServerClient.mockResolvedValue(undefined);
    expect((await handleGoogleSignIn(request({ code: "c" }))).status).toBe(503);
  });

  it("answers 400 for a body without a code", async () => {
    expect((await handleGoogleSignIn(request({}))).status).toBe(400);
    expect((await handleGoogleSignIn(request("not json"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("exchanges the code with the client secret and opens the Supabase session", async () => {
    const response = await handleGoogleSignIn(request({ code: "auth-code" }));
    expect(response.status).toBe(204);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const sent = init.body as URLSearchParams;
    expect(sent.get("code")).toBe("auth-code");
    expect(sent.get("client_secret")).toBe("secret");
    expect(sent.get("redirect_uri")).toBe("postmessage");
    expect(signInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "google-id-token",
    });
  });

  it("answers 401 when Google rejects the code, without opening a session", async () => {
    fetchMock.mockResolvedValue(new Response("bad", { status: 400 }));
    expect((await handleGoogleSignIn(request({ code: "c" }))).status).toBe(401);
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it("answers 502 when Google returns no ID token", async () => {
    fetchMock.mockResolvedValue(Response.json({}, { status: 200 }));
    expect((await handleGoogleSignIn(request({ code: "c" }))).status).toBe(502);
  });

  it("answers 401 when Supabase rejects the ID token", async () => {
    signInWithIdToken.mockResolvedValue({ error: new Error("rejected") });
    expect((await handleGoogleSignIn(request({ code: "c" }))).status).toBe(401);
  });

  it("never sends the client secret back to the browser", async () => {
    fetchMock.mockResolvedValue(new Response("bad", { status: 400 }));
    const response = await handleGoogleSignIn(request({ code: "c" }));
    expect(await response.text()).not.toContain("secret");
  });
});
