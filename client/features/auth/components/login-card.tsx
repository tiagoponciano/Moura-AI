"use client";

import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AUTH_PATHS } from "@/lib/auth/gate";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthCard } from "./auth-card";

type LoginCardProps = {
  failed: boolean;
};

/** "Entrar com Google": starts the Supabase OAuth flow, which returns to /auth/callback. */
export function LoginCard({ failed }: LoginCardProps) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(
    failed ? "Não foi possível entrar. Tente novamente." : undefined,
  );
  const supabase = createSupabaseBrowserClient();

  async function signIn() {
    if (!supabase) return;
    setRedirecting(true);
    setError(undefined);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${AUTH_PATHS.callback}`,
      },
    });
    if (oauthError) {
      console.error("Failed to start Google sign-in", oauthError);
      setError("Não foi possível abrir o login do Google.");
      setRedirecting(false);
    }
  }

  return (
    <AuthCard
      title="Entrar"
      description="Use sua conta Google. O primeiro acesso precisa ser aprovado por um administrador."
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      {supabase ? (
        <Button onClick={signIn} disabled={redirecting}>
          {redirecting ? <Loader2 className="animate-spin" /> : <LogIn />}
          Entrar com Google
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          O login não está configurado neste ambiente.
        </p>
      )}
    </AuthCard>
  );
}
