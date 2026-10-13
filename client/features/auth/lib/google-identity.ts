export const GOOGLE_IDENTITY_SCRIPT = "https://accounts.google.com/gsi/client";

type CredentialResponse = {
  /** Google ID token (JWT). */
  credential: string;
};

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    nonce?: string;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: "outline" | "filled_blue" | "filled_black";
      shape?: "rectangular" | "pill" | "circle" | "square";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      width?: number;
      locale?: string;
    },
  ): void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** Web OAuth client ID, or `undefined` when Google login is not configured. Referenced literally so Next inlines it. */
export function getGoogleClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined;
}
