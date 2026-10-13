import { NextResponse } from "next/server";
import { AUTH_PATHS } from "@/lib/auth/gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Google returns here through Supabase with `?code=`. Exchanging it sets the
 * session cookies; the redirect to `/` then goes through the proxy gate,
 * which applies the domain and approval checks.
 */
export async function handleAuthCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const failed = new URL(`${AUTH_PATHS.login}?error=auth_failed`, url.origin);

  const supabase = await createSupabaseServerClient();
  if (!supabase || !code) return NextResponse.redirect(failed);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Failed to exchange the OAuth code", error);
    return NextResponse.redirect(failed);
  }
  return NextResponse.redirect(new URL("/", url.origin));
}
