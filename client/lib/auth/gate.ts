import type { Database } from "@/lib/supabase/database.types";

export type ProfileStatus = Database["public"]["Enums"]["user_status"];

export const AUTH_PATHS = {
  login: "/login",
  pending: "/pending",
  unauthorized: "/unauthorized",
  callback: "/auth/callback",
} as const;

const AUTH_PAGES: string[] = [
  AUTH_PATHS.login,
  AUTH_PATHS.pending,
  AUTH_PATHS.unauthorized,
];

type GateInput = {
  pathname: string;
  /** Email of the signed-in user, `null` without a session. */
  email: string | null;
  /** `profiles.status`, `null` when the profile row is missing. */
  status: ProfileStatus | null;
  /** `ALLOWED_EMAIL_DOMAIN`; empty or undefined accepts every domain. */
  allowedDomain?: string;
};

export type GateDecision =
  | { type: "allow" }
  | { type: "redirect"; to: string }
  | { type: "deny"; status: 401 | 403; error: string };

export function isEmailAllowed(
  email: string,
  allowedDomain: string | undefined,
): boolean {
  const domain = allowedDomain?.trim().replace(/^@/, "").toLowerCase();
  if (!domain) return true;
  return email.toLowerCase().endsWith(`@${domain}`);
}

/** Where a request goes, given the session and the user's approval. */
export function resolveGate({
  pathname,
  email,
  status,
  allowedDomain,
}: GateInput): GateDecision {
  if (pathname === AUTH_PATHS.callback) return { type: "allow" };

  const target = !email
    ? AUTH_PATHS.login
    : !isEmailAllowed(email, allowedDomain) || status === "rejected"
      ? AUTH_PATHS.unauthorized
      : status !== "approved"
        ? AUTH_PATHS.pending
        : undefined;

  if (!target) {
    return AUTH_PAGES.includes(pathname)
      ? { type: "redirect", to: "/" }
      : { type: "allow" };
  }

  if (pathname.startsWith("/api/")) {
    return email
      ? { type: "deny", status: 403, error: "Access not approved" }
      : { type: "deny", status: 401, error: "Authentication required" };
  }

  return pathname === target
    ? { type: "allow" }
    : { type: "redirect", to: target };
}
