"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createNonce } from "@/lib/auth/google-nonce";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getGoogleClientId } from "../lib/google-identity";

/**
 * Google's own button, rendered on this site: Google hands the ID token to
 * the page and Supabase turns it into a session, so the browser never leaves
 * for the Supabase domain.
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  async function signIn(idToken: string, rawNonce: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setSigningIn(true);
    setError(undefined);
    const { error: authError } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      nonce: rawNonce,
    });
    if (authError) {
      console.error("Failed to sign in with the Google ID token", authError);
      setError("Não foi possível entrar. Tente novamente.");
      setSigningIn(false);
      return;
    }
    router.replace("/");
  }

  async function initialize() {
    const google = window.google;
    const clientId = getGoogleClientId();
    if (!google || !clientId) return;
    const nonce = await createNonce();
    google.accounts.id.initialize({
      client_id: clientId,
      nonce: nonce.hashed,
      callback: (response) => void signIn(response.credential, nonce.raw),
    });
    setInitialized(true);
  }

  // The button lives in Google's iframe and cannot be restyled, so it is redrawn when the theme changes.
  useEffect(() => {
    const google = window.google;
    const parent = buttonRef.current;
    if (!initialized || !google || !parent) return;
    google.accounts.id.renderButton(parent, {
      theme: resolvedTheme === "dark" ? "filled_black" : "outline",
      shape: "pill",
      size: "large",
      text: "signin_with",
      width: parent.offsetWidth,
      locale: "pt-BR",
    });
  }, [initialized, resolvedTheme]);

  return { buttonRef, initialize, signingIn, error };
}
