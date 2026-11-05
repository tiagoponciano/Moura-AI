import type { SupabaseClient } from "@supabase/supabase-js";
import { fromSiteCheckRow } from "@/lib/cbmsc-forms/catalog";
import { readCbmscSite } from "@/lib/cbmsc-forms/site-check";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { SiteCheckResponse } from "../lib/types";
import { requireSession, rpcErrorResponse } from "./respond";

/** Reads the CBMSC site and replaces the stored check with what it found. */
async function runAndStore(supabase: SupabaseClient<Database>) {
  const check = await readCbmscSite();
  const { error } = await supabase.from("cbmsc_site_check").upsert({
    id: true,
    checked_at: check.checkedAt,
    status: check.status,
    failures: check.failures,
    forms: check.forms,
  });
  return { check, error };
}

/** `GET /api/admin/forms/site-check`: the latest check, `null` before the first. */
export async function handleGetSiteCheck(): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { data, error } = await session.supabase
    .from("cbmsc_site_check")
    .select("*")
    .maybeSingle();
  if (error) return rpcErrorResponse(error, "Failed to load the site check");

  const body: SiteCheckResponse = {
    check: data && fromSiteCheckRow(data),
  };
  return Response.json(body);
}

/** `POST /api/admin/forms/site-check`: "Verificar agora". */
export async function handleRunSiteCheck(): Promise<Response> {
  const session = await requireSession();
  if (session.error) return session.error;

  const { check, error } = await runAndStore(session.supabase);
  if (error) return rpcErrorResponse(error, "Failed to save the site check");

  const body: SiteCheckResponse = { check };
  return Response.json(body);
}

/**
 * `GET /api/cron/cbmsc-forms`, called by Vercel Cron with `CRON_SECRET` as a
 * bearer token. There is no user, so this is the one forms route that uses the
 * service role. Without the secret configured it refuses every call.
 */
export async function handleCronSiteCheck(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Invalid cron secret" }, { status: 401 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return Response.json(
      { error: "The service role is not configured" },
      { status: 503 },
    );
  }

  const { check, error } = await runAndStore(supabase);
  if (error) return rpcErrorResponse(error, "Failed to save the site check");
  return Response.json({
    status: check.status,
    failures: check.failures,
    forms: check.forms.length,
  });
}
