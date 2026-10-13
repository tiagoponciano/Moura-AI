import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleClientId } from "../lib/google-identity";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const bodySchema = z.object({ code: z.string().min(1) });

const fail = (status: number, error: string) =>
  Response.json({ error }, { status });

/**
 * `POST /api/auth/google` with `{ code }` from Google's popup: exchanges the
 * code for an ID token with the client secret, then opens the Supabase
 * session in this response's cookies. 204 on success.
 */
export async function handleGoogleSignIn(req: Request): Promise<Response> {
  // Google's CSRF guard for the popup code flow: another site cannot send this header without a CORS preflight.
  if (req.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return fail(403, "Missing X-Requested-With header");
  }

  const clientId = getGoogleClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const supabase = await createSupabaseServerClient();
  if (!clientId || !clientSecret || !supabase) {
    return fail(503, "Google sign-in is not configured");
  }

  const body = bodySchema.safeParse(await req.json().catch(() => undefined));
  if (!body.success) return fail(400, "Invalid body");

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: body.data.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) {
    console.error(
      "Google rejected the authorization code",
      tokenResponse.status,
      await tokenResponse.text(),
    );
    return fail(401, "Google rejected the sign-in");
  }
  const { id_token: idToken } = (await tokenResponse.json()) as {
    id_token?: string;
  };
  if (!idToken) {
    console.error("Google token response has no id_token");
    return fail(502, "Google did not return an ID token");
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) {
    console.error("Failed to sign in with the Google ID token", error);
    return fail(401, "Supabase rejected the Google ID token");
  }
  return new Response(null, { status: 204 });
}
