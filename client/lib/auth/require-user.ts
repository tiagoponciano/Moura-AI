import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only. The request-scoped client and the signed-in user, or a 503
 * response with `notConfiguredMessage` when Supabase is not configured, or a
 * 401 without a session.
 */
export async function requireUser(notConfiguredMessage: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      error: Response.json({ error: notConfiguredMessage }, { status: 503 }),
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  return { supabase, user };
}
