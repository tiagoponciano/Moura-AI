"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import Script from "next/script";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { useGoogleSignIn } from "../hooks/use-google-sign-in";
import {
  GOOGLE_IDENTITY_SCRIPT,
  getGoogleClientId,
} from "../lib/google-identity";

/** Logo, product name and Google's "Fazer login com o Google" button, whose ID token becomes a Supabase session. */
export function LoginCard() {
  const { buttonRef, initialize, signingIn, error } = useGoogleSignIn();
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
          <Script
            src={GOOGLE_IDENTITY_SCRIPT}
            onReady={() => void initialize()}
          />
          {/* Google's iframe is a light document; a dark color-scheme on it makes Chromium paint it an opaque white backdrop. */}
          <div
            ref={buttonRef}
            className="h-10 w-full [color-scheme:light]"
            hidden={signingIn}
          />
          {signingIn && (
            <p className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Entrando…
            </p>
          )}
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
