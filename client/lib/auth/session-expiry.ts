/** How long a session may go unused before it must sign in again. */
export const SESSION_IDLE_TIMEOUT_SECONDS = 24 * 60 * 60;

/** Cookie holding the time (ms) of the session's latest request. */
export const LAST_ACTIVE_COOKIE = "last-active-at";

/**
 * When the session's user signed in, in ms: the earliest `amr` timestamp of
 * the Supabase access token. Refreshed tokens keep it. `undefined` when the
 * token cannot be read.
 */
function getSignedInAt(accessToken: string): number | undefined {
  try {
    const payload = accessToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64)) as { amr?: unknown };
    if (!Array.isArray(claims.amr)) return undefined;
    const timestamps = claims.amr
      .map((entry) => (entry as { timestamp?: unknown })?.timestamp)
      .filter((value): value is number => typeof value === "number");
    return timestamps.length ? Math.min(...timestamps) * 1000 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether the session must sign in again: its latest activity — the later of
 * `lastActiveAt` and the sign-in time — is `SESSION_IDLE_TIMEOUT_SECONDS` or
 * more before `now`. All times in ms. Expired when neither is known.
 */
export function isSessionExpired(
  accessToken: string | undefined,
  lastActiveAt: number | undefined,
  now: number,
): boolean {
  const signedInAt = accessToken ? getSignedInAt(accessToken) : undefined;
  const known = [signedInAt, lastActiveAt].filter(
    (value): value is number => value !== undefined,
  );
  if (!known.length) return true;
  return now - Math.max(...known) >= SESSION_IDLE_TIMEOUT_SECONDS * 1000;
}
