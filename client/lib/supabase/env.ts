export type SupabaseEnv = { url: string; anonKey: string };

/**
 * Supabase is optional: without both variables the app runs as before, with
 * no login and no persistence. Referenced literally so Next inlines them in
 * the browser bundle.
 */
export function getSupabaseEnv(): SupabaseEnv | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : undefined;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== undefined;
}
