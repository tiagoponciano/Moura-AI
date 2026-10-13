export const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

export type CodeResponse = {
  /** One-time authorization code, exchanged on the server. Absent when the user declines. */
  code?: string;
  error?: string;
};

export type CodeClient = {
  /** Opens Google's account chooser in a popup; must run inside a click handler. */
  requestCode(): void;
};

type GoogleOAuth2 = {
  initCodeClient(config: {
    client_id: string;
    scope: string;
    ux_mode: "popup";
    callback: (response: CodeResponse) => void;
    error_callback?: (error: {
      type: "popup_failed_to_open" | "popup_closed" | "unknown";
    }) => void;
  }): CodeClient;
};

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

/** Web OAuth client ID, or `undefined` when Google login is not configured. Referenced literally so Next inlines it. */
export function getGoogleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
}
