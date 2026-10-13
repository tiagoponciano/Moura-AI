import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AUTH_PATHS } from "./gate";

/** Browser-only. Ends the Supabase session and reloads on the login page. */
export async function signOut(): Promise<void> {
  await createSupabaseBrowserClient()?.auth.signOut();
  window.location.assign(AUTH_PATHS.login);
}
