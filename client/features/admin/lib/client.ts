import type { LlmProvider } from "@/lib/llm/catalog";
import type {
  AdminSettingsResponse,
  AdminUser,
  AdminUsersResponse,
} from "./types";

export const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause);

/** Throws with the server's `error` message so the console can show it. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const fetchUsers = () => request<AdminUsersResponse>("/api/admin/users");

export const updateUser = (
  id: string,
  change: Partial<Pick<AdminUser, "status" | "role">>,
) =>
  request<void>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });

export const fetchSettings = () =>
  request<AdminSettingsResponse>("/api/admin/settings");

export const updateSettings = (change: {
  llm?: { provider: LlmProvider; model: string };
  allowedEmailDomain?: string;
}) =>
  request<void>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(change),
  });

export const setProviderKey = (provider: LlmProvider, key: string) =>
  request<void>(`/api/admin/settings/keys/${provider}`, {
    method: "PUT",
    body: JSON.stringify({ key }),
  });
