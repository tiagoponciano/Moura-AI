"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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
  const buttonRef = useRef<HTMLDivElement>(null);
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

  async function renderButton() {
    const google = window.google;
    const clientId = getGoogleClientId();
    const parent = buttonRef.current;
    if (!google || !clientId || !parent) return;
    const nonce = await createNonce();
    google.accounts.id.initialize({
      client_id: clientId,
      nonce: nonce.hashed,
      callback: (response) => void signIn(response.credential, nonce.raw),
    });
    google.accounts.id.renderButton(parent, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      width: parent.offsetWidth,
      locale: "pt-BR",
    });
  }

  return { buttonRef, renderButton, signingIn, error };
}
