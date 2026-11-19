import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { googleAuthHeader, isGoogleIdentityConfigured } = vi.hoisted(() => ({
  googleAuthHeader: vi.fn(),
  isGoogleIdentityConfigured: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/google-identity", () => ({
  googleAuthHeader,
  isGoogleIdentityConfigured,
}));

import { convertWithDwgService } from "./dwg-service";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("DWG_SERVICE_URL", "https://dwg.run.app");
  vi.stubEnv("DWG_SERVICE_TOKEN", "tok");
  fetchMock.mockResolvedValue(new Response("x", { status: 200 }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const sentHeaders = () => fetchMock.mock.calls[0][1].headers;

describe("convertWithDwgService, how it identifies itself", () => {
  it("sends the token as a Bearer and in X-Service-Token for a service with its own token", async () => {
    isGoogleIdentityConfigured.mockReturnValue(false);
    await convertWithDwgService(new Blob(["a"]), "p.pdf", "dwg", 100);
    expect(sentHeaders()).toEqual({
      Authorization: "Bearer tok",
      "X-Service-Token": "tok",
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://dwg.run.app/convert?format=dwg&scale=100",
    );
  });

  it("leaves Authorization to Google's identity token behind Cloud Run, and keeps the token in X-Service-Token", async () => {
    isGoogleIdentityConfigured.mockReturnValue(true);
    googleAuthHeader.mockResolvedValue({ Authorization: "Bearer google" });
    await convertWithDwgService(new Blob(["a"]), "p.pdf", "dxf", 1);
    expect(sentHeaders()).toEqual({
      Authorization: "Bearer google",
      "X-Service-Token": "tok",
    });
    expect(googleAuthHeader).toHaveBeenCalledWith("https://dwg.run.app");
  });

  it("throws with the status when the service refuses", async () => {
    isGoogleIdentityConfigured.mockReturnValue(false);
    fetchMock.mockResolvedValue(new Response("no", { status: 401 }));
    await expect(
      convertWithDwgService(new Blob(["a"]), "p.pdf", "dwg", 1),
    ).rejects.toMatchObject({ status: 401 });
  });
});
