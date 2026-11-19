import { requireUser } from "@/lib/auth/require-user";
import { listNormSources } from "../lib/norm-sources";

/** `GET /api/admin/norms`: where each norm comes from. The proxy already keeps non-admins out. */
export async function handleGetNormSources(): Promise<Response> {
  const auth = await requireUser("Admin console is not configured");
  if (auth.error) return auth.error;
  return Response.json({ norms: listNormSources() });
}
