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

import { convertDocxToPdf, convertHtmlToPdf } from "./pdf-service";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PDF_SERVICE_URL", "https://pdf.run.app");
  vi.stubEnv("PDF_SERVICE_USER", "moura");
  vi.stubEnv("PDF_SERVICE_PASSWORD", "pw");
  fetchMock.mockResolvedValue(new Response("%PDF", { status: 200 }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const sentAuthorization = () =>
  fetchMock.mock.calls[0][1].headers.Authorization;

describe("the PDF service, how it identifies itself", () => {
  it("sends Basic credentials to a service with its own password", async () => {
    isGoogleIdentityConfigured.mockReturnValue(false);
    await convertDocxToPdf(new Uint8Array([1]));
    expect(sentAuthorization()).toBe(
      `Basic ${Buffer.from("moura:pw").toString("base64")}`,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://pdf.run.app/forms/libreoffice/convert",
    );
  });

  it("sends only Google's identity token behind Cloud Run, never the Basic header it would refuse", async () => {
    isGoogleIdentityConfigured.mockReturnValue(true);
    googleAuthHeader.mockResolvedValue({ Authorization: "Bearer google" });
    await convertHtmlToPdf("<p>a</p>");
    expect(sentAuthorization()).toBe("Bearer google");
    expect(googleAuthHeader).toHaveBeenCalledWith("https://pdf.run.app");
  });

  it("throws with the status when the service refuses", async () => {
    isGoogleIdentityConfigured.mockReturnValue(false);
    fetchMock.mockResolvedValue(new Response("no", { status: 401 }));
    await expect(convertDocxToPdf(new Uint8Array([1]))).rejects.toThrow("401");
  });
});
