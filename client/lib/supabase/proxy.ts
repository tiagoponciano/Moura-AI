import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  LAST_ACTIVE_COOKIE,
  isSessionExpired,
} from "@/lib/auth/session-expiry";
import type { Database } from "./database.types";
import type { SupabaseEnv } from "./env";

/**
 * For proxy.ts only. Refreshes the auth session from the request cookies and
 * returns the signed-in user. A session unused for a day is signed out and
 * comes back without a user; every other request with a user records its time
 * in `LAST_ACTIVE_COOKIE`. Every response sent back must go through
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
  const now = Date.now();
  if (user) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const lastActiveAt =
      Number(request.cookies.get(LAST_ACTIVE_COOKIE)?.value) || undefined;
    if (isSessionExpired(session?.access_token, lastActiveAt, now)) {
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
    if (user) {
      target.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        maxAge: 400 * 24 * 60 * 60,
      });
    } else {
      target.cookies.delete(LAST_ACTIVE_COOKIE);
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
