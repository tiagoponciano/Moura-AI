import type { PostgrestError } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/require-user";

/** The request-scoped client and the signed-in user, or a 503/401 response. */
export const requireSession = () =>
  requireUser("Admin console is not configured");

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
