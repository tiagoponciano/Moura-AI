import { NextResponse, type NextRequest } from "next/server";
import { resolveGate } from "@/lib/auth/gate";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { refreshSession } from "@/lib/supabase/proxy";

/** Login and approval gate for every page and API route. Off when Supabase is not configured. */
export async function proxy(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) return NextResponse.next();

  const session = await refreshSession(request, env);
  let status = null;
  if (session.user) {
    const { data } = await session.supabase
      .from("profiles")
      .select("status")
      .eq("id", session.user.id)
      .maybeSingle();
    status = data?.status ?? null;
  }

  const decision = resolveGate({
    pathname: request.nextUrl.pathname,
    email: session.user?.email ?? null,
    status,
    allowedDomain: process.env.ALLOWED_EMAIL_DOMAIN,
  });

  switch (decision.type) {
    case "allow":
      return session.respond();
    case "redirect":
      return session.redirect(decision.to);
    case "deny":
      return session.deny(decision.status, decision.error);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
