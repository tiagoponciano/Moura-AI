import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/** Browser-only. The shared client for the signed-in user, or `undefined` when Supabase is not configured. */
export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) return undefined;
  return createBrowserClient<Database>(env.url, env.anonKey);
}
