"use client";

import { Loader2 } from "lucide-react";
import Script from "next/script";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import {
  GOOGLE_IDENTITY_SCRIPT,
  getGoogleClientId,
} from "../lib/google-identity";
import { AuthCard } from "./auth-card";

/** "Fazer login com o Google": Google's button, whose ID token becomes a Supabase session. */
export function LoginCard() {
  const { buttonRef, renderButton, signingIn, error } = useGoogleSignIn();
  const configured = isSupabaseConfigured() && Boolean(getGoogleClientId());

  return (
    <AuthCard
      title="Entrar"
      description="Use sua conta Google. O primeiro acesso precisa ser aprovado por um administrador."
    >
      {error && <p className="text-sm text-destructive">{error}</p>}
      {configured ? (
        <>
          <Script
            src={GOOGLE_IDENTITY_SCRIPT}
            onReady={() => void renderButton()}
          />
          <div ref={buttonRef} className="h-10" hidden={signingIn} />
          {signingIn && (
            <p className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Entrando…
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          O login não está configurado neste ambiente.
        </p>
      )}
    </AuthCard>
  );
}
