import { describe, expect, it } from "vitest";
import { SESSION_MAX_AGE_SECONDS, isSessionExpired } from "./session-expiry";

const SIGNED_IN_AT = 1_760_000_000;

/** An unsigned JWT with the given payload; only the payload is read. */
function token(payload: object): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode(payload)}.signature`;
}

const atSecond = (seconds: number) => seconds * 1000;

describe("isSessionExpired", () => {
  it("keeps a session signed in less than 24 hours ago", () => {
    const accessToken = token({
      amr: [{ method: "oauth", timestamp: SIGNED_IN_AT }],
    });
    const now = atSecond(SIGNED_IN_AT + SESSION_MAX_AGE_SECONDS - 1);
    expect(isSessionExpired(accessToken, now)).toBe(false);
  });

  it("expires a session signed in 24 hours ago or more", () => {
    const accessToken = token({
      amr: [{ method: "oauth", timestamp: SIGNED_IN_AT }],
    });
    const now = atSecond(SIGNED_IN_AT + SESSION_MAX_AGE_SECONDS);
    expect(isSessionExpired(accessToken, now)).toBe(true);
  });

  it("counts from the earliest sign-in method when there are several", () => {
    const accessToken = token({
      amr: [
        { method: "totp", timestamp: SIGNED_IN_AT + 3600 },
        { method: "oauth", timestamp: SIGNED_IN_AT },
      ],
    });
    const now = atSecond(SIGNED_IN_AT + SESSION_MAX_AGE_SECONDS);
    expect(isSessionExpired(accessToken, now)).toBe(true);
  });

  it("expires a session whose token has no sign-in time", () => {
    expect(isSessionExpired(token({ sub: "user" }), Date.now())).toBe(true);
    expect(isSessionExpired(token({ amr: ["oauth"] }), Date.now())).toBe(true);
  });

  it("expires a session whose token cannot be decoded", () => {
    expect(isSessionExpired("not-a-jwt", Date.now())).toBe(true);
    expect(isSessionExpired(undefined, Date.now())).toBe(true);
  });
});
