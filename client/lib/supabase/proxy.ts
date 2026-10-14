import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSessionExpired } from "@/lib/auth/session-expiry";
import type { Database } from "./database.types";
import type { SupabaseEnv } from "./env";

/**
 * For proxy.ts only. Refreshes the auth session from the request cookies and
 * returns the signed-in user. A session older than a day is signed out and
 * comes back without a user. Every response sent back must go through
 * `respond`/`redirect` so refreshed cookies and their no-cache headers are kept.
 */
export async function refreshSession(request: NextRequest, env: SupabaseEnv) {
  let response = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        cacheHeaders = { ...cacheHeaders, ...headers };
      },
    },
  });

  let {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (isSessionExpired(session?.access_token, Date.now())) {
      await supabase.auth.signOut({ scope: "local" });
      user = null;
    }
  }

  function withSession(target: NextResponse): NextResponse {
    if (target !== response) {
      for (const cookie of response.cookies.getAll()) {
        target.cookies.set(cookie);
      }
    }
    for (const [key, value] of Object.entries(cacheHeaders)) {
      target.headers.set(key, value);
    }
    return target;
  }

  return {
    supabase,
    user,
    respond: () => withSession(response),
    redirect: (pathname: string) =>
      withSession(NextResponse.redirect(new URL(pathname, request.url))),
    deny: (status: number, error: string) =>
      withSession(NextResponse.json({ error }, { status })),
  };
}
