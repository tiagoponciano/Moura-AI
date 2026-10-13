"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GOOGLE_SIGN_IN_API } from "@/lib/auth/gate";
import {
  getGoogleClientId,
  type CodeClient,
  type CodeResponse,
} from "../lib/google-identity";

const SIGN_IN_ERROR = "Não foi possível entrar. Tente novamente.";

/**
 * Our own button opens Google's account chooser in a popup; the server trades
 * the code for an ID token and opens the Supabase session, so the browser
 * never leaves for the Supabase domain.
 */
export function useGoogleSignIn() {
  const router = useRouter();
  const clientRef = useRef<CodeClient | null>(null);
  const [ready, setReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string>();

  async function exchange({ code }: CodeResponse) {
    // No code means the user declined in the popup: nothing to report.
    if (!code) return;
    setSigningIn(true);
    const response = await fetch(GOOGLE_SIGN_IN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ code }),
    }).catch(() => undefined);
    if (!response?.ok) {
      console.error("Google sign-in failed", response?.status);
      setError(SIGN_IN_ERROR);
      setSigningIn(false);
      return;
    }
    router.replace("/");
  }

  function initialize() {
    const google = window.google;
    const clientId = getGoogleClientId();
    if (!google || !clientId) return;
    clientRef.current = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => void exchange(response),
      error_callback: ({ type }) => {
        if (type === "popup_failed_to_open") {
          setError(
            "O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.",
          );
        }
      },
    });
    setReady(true);
  }

  function signIn() {
    setError(undefined);
    clientRef.current?.requestCode();
  }

  return { initialize, ready, signIn, signingIn, error };
}
