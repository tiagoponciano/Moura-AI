import { requestJson } from "@/lib/api/request-json";
import type { LlmProvider } from "@/lib/llm/catalog";
import type {
  AdminSettingsResponse,
  AdminUser,
  AdminUsersResponse,
} from "./types";

export const fetchUsers = () =>
  requestJson<AdminUsersResponse>("/api/admin/users");

export const updateUser = (
  id: string,
  change: Partial<Pick<AdminUser, "status" | "role">>,
) =>
  requestJson<void>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });

export const fetchSettings = () =>
  requestJson<AdminSettingsResponse>("/api/admin/settings");

export const updateSettings = (change: {
  llm?: { provider: LlmProvider; model: string };
  allowedEmailDomain?: string;
}) =>
  requestJson<void>("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(change),
  });

export const setProviderKey = (provider: LlmProvider, key: string) =>
  requestJson<void>(`/api/admin/settings/keys/${provider}`, {
    method: "PUT",
    body: JSON.stringify({ key }),
  });
