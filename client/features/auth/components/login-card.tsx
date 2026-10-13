"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import {
  GOOGLE_IDENTITY_SCRIPT,
  getGoogleClientId,
} from "../lib/google-identity";
import { GoogleLogo } from "./google-logo";

/** Logo, product name and our "Entrar com Google" button, which opens Google's account chooser in a popup. */
export function LoginCard() {
  const { initialize, ready, signIn, signingIn, error } = useGoogleSignIn();
  const configured = isSupabaseConfigured() && Boolean(getGoogleClientId());

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-xl dark:bg-white/90">
          <Image
            src="/brand/moura-logo.png"
            alt="Moura"
            width={46}
            height={46}
            priority
          />
        </div>
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Moura Engenharia
          </h1>
          <p className="text-sm text-muted-foreground">
            Prevenção contra incêndio
          </p>
        </div>
      </div>
      {configured ? (
        <div className="flex w-full flex-col items-center gap-3">
          <Script src={GOOGLE_IDENTITY_SCRIPT} onReady={initialize} />
          <Button
            variant="outline"
            size="lg"
            className="h-10 w-full gap-2"
            disabled={!ready || signingIn}
            onClick={signIn}
          >
            {signingIn ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleLogo className="size-4" />
            )}
            {signingIn ? "Entrando…" : "Entrar com Google"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          O login não está configurado neste ambiente.
        </p>
      )}
    </div>
  );
}
