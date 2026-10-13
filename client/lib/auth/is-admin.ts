import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Server-only. Whether the signed-in user is an approved admin; `false` without Supabase. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { data } = await supabase.rpc("get_gate_state").maybeSingle();
  return data?.status === "approved" && data.role === "admin";
}
