import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodType } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const notConfigured = () =>
  Response.json({ error: "Admin console is not configured" }, { status: 503 });

/** Parses the JSON body with `schema`; a 400 response when it does not fit. */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { error: Response }> {
  const body: unknown = await req.json().catch(() => undefined);
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 },
      ),
    };
  }
  return { data: result.data };
}

/**
 * Maps the errors raised by the admin RPCs (see the admin migration) to HTTP;
 * anything else is logged and answered with 500 and `fallback`.
 */
export function rpcErrorResponse(
  error: PostgrestError,
  fallback: string,
): Response {
  switch (error.code) {
    case "42501":
      return Response.json({ error: "Admin only" }, { status: 403 });
    case "22023":
      return Response.json({ error: error.message }, { status: 400 });
    case "P0002":
      return Response.json({ error: error.message }, { status: 404 });
  }
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}

/** The request-scoped client and the signed-in user, or a 503/401 response. */
export async function requireSession() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: notConfigured() };
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
