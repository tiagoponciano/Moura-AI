/** How long a sign-in lasts. Token refreshes do not extend it. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * When the session's user signed in, in seconds: the earliest `amr` timestamp
 * of the Supabase access token. Refreshed tokens keep it. `undefined` when the
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
    return timestamps.length ? Math.min(...timestamps) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether the session must sign in again: it started `SESSION_MAX_AGE_SECONDS`
 * or more before `now` (ms), or its sign-in time cannot be read.
 */
export function isSessionExpired(
  accessToken: string | undefined,
  now: number,
): boolean {
  const signedInAt = accessToken ? getSignedInAt(accessToken) : undefined;
  if (signedInAt === undefined) return true;
  return now / 1000 - signedInAt >= SESSION_MAX_AGE_SECONDS;
}
