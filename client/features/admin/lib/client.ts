import { requestJson } from "@/lib/api/request-json";
import type { LlmProvider } from "@/lib/llm/catalog";
import type {
  AdminFormsResponse,
  AdminSettingsResponse,
  AdminUsersResponse,
  ResolveFormLinkResponse,
  SiteCheckResponse,
  UserChange,
} from "./types";
import type { FormChange, FormDraftInput } from "./validation";

export const fetchUsers = () =>
  requestJson<AdminUsersResponse>("/api/admin/users");

export const updateUser = (id: string, change: UserChange) =>
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

export const fetchForms = () =>
  requestJson<AdminFormsResponse>("/api/admin/forms");

export const resolveFormLink = (url: string) =>
  requestJson<ResolveFormLinkResponse>("/api/admin/forms/resolve", {
    method: "POST",
    body: JSON.stringify({ url }),
  });

export const saveForms = (forms: FormDraftInput[]) =>
  requestJson<void>("/api/admin/forms", {
    method: "POST",
    body: JSON.stringify({ forms }),
  });

export const updateForm = (id: string, change: FormChange) =>
  requestJson<void>(`/api/admin/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(change),
  });

export const fetchSiteCheck = () =>
  requestJson<SiteCheckResponse>("/api/admin/forms/site-check");

export const runSiteCheck = () =>
  requestJson<SiteCheckResponse>("/api/admin/forms/site-check", {
    method: "POST",
  });
