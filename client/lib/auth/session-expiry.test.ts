import { describe, expect, it } from "vitest";
import {
  SESSION_IDLE_TIMEOUT_SECONDS,
  isSessionExpired,
} from "./session-expiry";

const SIGNED_IN_AT = 1_760_000_000;
const DAY_MS = SESSION_IDLE_TIMEOUT_SECONDS * 1000;

/** An unsigned JWT with the given payload; only the payload is read. */
function token(payload: object): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none" })}.${encode(payload)}.signature`;
}

const signedIn = token({ amr: [{ method: "oauth", timestamp: SIGNED_IN_AT }] });
const signedInMs = SIGNED_IN_AT * 1000;

describe("isSessionExpired", () => {
  it("keeps a session used less than 24 hours ago", () => {
    const lastActiveAt = signedInMs + 3 * DAY_MS;
    const now = lastActiveAt + DAY_MS - 1;
    expect(isSessionExpired(signedIn, lastActiveAt, now)).toBe(false);
  });

  it("expires a session unused for 24 hours or more", () => {
    const lastActiveAt = signedInMs + 3 * DAY_MS;
    const now = lastActiveAt + DAY_MS;
    expect(isSessionExpired(signedIn, lastActiveAt, now)).toBe(true);
  });

  it("counts from the sign-in when there is no recorded activity", () => {
    expect(isSessionExpired(signedIn, undefined, signedInMs + DAY_MS - 1)).toBe(
      false,
    );
    expect(isSessionExpired(signedIn, undefined, signedInMs + DAY_MS)).toBe(
      true,
    );
  });

  it("counts from the sign-in when it is newer than the recorded activity", () => {
    const lastActiveAt = signedInMs - 2 * DAY_MS;
    expect(isSessionExpired(signedIn, lastActiveAt, signedInMs + 1000)).toBe(
      false,
    );
  });

  it("counts from the earliest sign-in method when there are several", () => {
    const accessToken = token({
      amr: [
        { method: "totp", timestamp: SIGNED_IN_AT + 3600 },
        { method: "oauth", timestamp: SIGNED_IN_AT },
      ],
    });
    expect(isSessionExpired(accessToken, undefined, signedInMs + DAY_MS)).toBe(
      true,
    );
  });

  it("falls back to the recorded activity when the token has no sign-in time", () => {
    const lastActiveAt = signedInMs;
    const accessToken = token({ sub: "user" });
    expect(isSessionExpired(accessToken, lastActiveAt, lastActiveAt + 1)).toBe(
      false,
    );
  });

  it("expires a session with neither a sign-in time nor recorded activity", () => {
    expect(isSessionExpired(token({ amr: ["oauth"] }), undefined, 0)).toBe(
      true,
    );
    expect(isSessionExpired("not-a-jwt", undefined, 0)).toBe(true);
    expect(isSessionExpired(undefined, undefined, 0)).toBe(true);
  });
});
