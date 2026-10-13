import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Server-only. A client with the service role key: bypasses RLS and can call
 * `get_llm_config()`. `undefined` when Supabase or `SUPABASE_SERVICE_ROLE_KEY`
 * is not configured. Never use it for anything a user asked for directly.
 */
export function createSupabaseAdminClient() {
  const env = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRoleKey) return undefined;

  return createClient<Database>(env.url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
