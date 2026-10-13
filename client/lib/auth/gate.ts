import type { Database } from "@/lib/supabase/database.types";

export type ProfileStatus = Database["public"]["Enums"]["user_status"];
export type ProfileRole = Database["public"]["Enums"]["user_role"];

export const AUTH_PATHS = {
  login: "/login",
  pending: "/pending",
  unauthorized: "/unauthorized",
} as const;

export const ADMIN_PATH = "/admin";

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

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
  /** `profiles.role`; anything but `"admin"` is treated as a member. */
  role?: ProfileRole | null;
  /** Allowed e-mail domain; empty or undefined accepts every domain. */
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
  role,
  allowedDomain,
}: GateInput): GateDecision {
  const target = !email
    ? AUTH_PATHS.login
    : !isEmailAllowed(email, allowedDomain) || status === "rejected"
      ? AUTH_PATHS.unauthorized
      : status !== "approved"
        ? AUTH_PATHS.pending
        : undefined;

  if (!target) {
    if (AUTH_PAGES.includes(pathname)) return { type: "redirect", to: "/" };
    if (role !== "admin") {
      if (isUnder(pathname, `/api${ADMIN_PATH}`)) {
        return { type: "deny", status: 403, error: "Admin only" };
      }
      if (isUnder(pathname, ADMIN_PATH)) return { type: "redirect", to: "/" };
    }
    return { type: "allow" };
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
