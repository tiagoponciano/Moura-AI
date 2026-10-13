export type Nonce = {
  /** Sent to Supabase with the ID token. */
  raw: string;
  /** SHA-256 of `raw` in hex; sent to Google, which puts it in the ID token. */
  hashed: string;
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** One per sign-in attempt, so a captured ID token cannot be replayed. */
export async function createNonce(): Promise<Nonce> {
  const raw = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw),
  );
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}
