import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchIdToken, getIdTokenClient, GoogleAuth } = vi.hoisted(() => {
  const fetchIdToken = vi.fn();
  const getIdTokenClient = vi.fn(async () => ({
    idTokenProvider: { fetchIdToken },
  }));
  const GoogleAuth = vi.fn(function () {
    return { getIdTokenClient };
  });
  return { fetchIdToken, getIdTokenClient, GoogleAuth };
});
vi.mock("server-only", () => ({}));
vi.mock("google-auth-library", () => ({ GoogleAuth }));

const KEY = JSON.stringify({ client_email: "a@b.iam", private_key: "k" });

async function load() {
  vi.resetModules();
  return import("./google-identity");
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchIdToken.mockResolvedValue("id-token");
});
afterEach(() => vi.unstubAllEnvs());

describe("googleAuthHeader", () => {
  it("sends no header, and builds no client, without a service account", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "");
    const { googleAuthHeader, isGoogleIdentityConfigured } = await load();
    expect(isGoogleIdentityConfigured()).toBe(false);
    expect(await googleAuthHeader("https://svc.run.app")).toEqual({});
    expect(GoogleAuth).not.toHaveBeenCalled();
  });

  it("asks Google for an identity token for the service's own URL", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", KEY);
    const { googleAuthHeader, isGoogleIdentityConfigured } = await load();
    expect(isGoogleIdentityConfigured()).toBe(true);
    expect(await googleAuthHeader("https://svc.run.app")).toEqual({
      Authorization: "Bearer id-token",
    });
    expect(GoogleAuth).toHaveBeenCalledWith({ credentials: JSON.parse(KEY) });
    expect(getIdTokenClient).toHaveBeenCalledWith("https://svc.run.app");
    expect(fetchIdToken).toHaveBeenCalledWith("https://svc.run.app");
  });

  it("reuses the client for the same service and makes one for another", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", KEY);
    const { googleAuthHeader } = await load();
    await googleAuthHeader("https://a.run.app");
    await googleAuthHeader("https://a.run.app");
    await googleAuthHeader("https://b.run.app");
    expect(getIdTokenClient).toHaveBeenCalledTimes(2);
  });

  it("throws for a key that is not JSON", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON", "not json");
    const { googleAuthHeader } = await load();
    await expect(googleAuthHeader("https://svc.run.app")).rejects.toThrow();
  });
});
