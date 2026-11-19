import "server-only";
import { GoogleAuth } from "google-auth-library";

/**
 * Whether the app has a Google service account to call private Cloud Run services
 * with (`GOOGLE_SERVICE_ACCOUNT_JSON`, the key file's content). Without it the
 * services are called with their own password or token, as on a local Docker.
 */
export const isGoogleIdentityConfigured = () =>
  Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

const clients = new Map<
  string,
  Promise<{
    idTokenProvider: { fetchIdToken(audience: string): Promise<string> };
  }>
>();

/**
 * Server-only. The `Authorization` header that lets the service account call the
 * Cloud Run service at `audience` (its URL), or no header when no account is
 * configured. Google signs a short-lived identity token and the client reuses it
 * until it is about to expire. Throws when the key is not valid JSON.
 */
export async function googleAuthHeader(
  audience: string,
): Promise<Record<string, string>> {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!key) return {};
  let client = clients.get(audience);
  if (!client) {
    client = new GoogleAuth({ credentials: JSON.parse(key) }).getIdTokenClient(
      audience,
    );
    clients.set(audience, client);
  }
  const token = await (await client).idTokenProvider.fetchIdToken(audience);
  return { Authorization: `Bearer ${token}` };
}
