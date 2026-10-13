import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createNonce } from "./google-nonce";

describe("createNonce", () => {
  it("hashes the raw nonce as lower-case hex SHA-256", async () => {
    const { raw, hashed } = await createNonce();
    expect(hashed).toBe(createHash("sha256").update(raw).digest("hex"));
  });

  it("returns a different raw nonce on every call", async () => {
    const [first, second] = await Promise.all([createNonce(), createNonce()]);
    expect(first.raw).not.toBe(second.raw);
  });
});
