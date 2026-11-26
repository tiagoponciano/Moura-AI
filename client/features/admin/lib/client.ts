import { requestJson } from "@/lib/api/request-json";
import type { LlmProvider } from "@/lib/llm/catalog";
import type {
  AdminFormsResponse,
  AdminNormsResponse,
  AdminSettingsResponse,
  AdminUsersResponse,
  ProposalTemplateInfo,
  ResolveFormLinkResponse,
  SiteCheckResponse,
  UserChange,
} from "./types";
import { tagProblems } from "./proposal-template";
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

export const setProviderAccess = (
  provider: LlmProvider,
  access: { restricted: boolean; userIds: string[] },
) =>
  requestJson<void>(`/api/admin/settings/access/${provider}`, {
    method: "PUT",
    body: JSON.stringify(access),
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

export const fetchNorms = () =>
  requestJson<AdminNormsResponse>("/api/admin/norms");

export const fetchProposalTemplate = () =>
  requestJson<ProposalTemplateInfo>("/api/documents/proposal-template");

export const resetProposalTemplate = () =>
  requestJson<void>("/api/documents/proposal-template", { method: "DELETE" });

/** Sends the deck; throws with the server's message and, for a deck whose tags are wrong, the tags. */
export async function uploadProposalTemplate(file: File): Promise<void> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/documents/proposal-template", {
    method: "PUT",
    body,
  });
  if (response.ok) return;
  const failure = await response.json().catch(() => undefined);
  const detail = failure ? tagProblems(failure) : undefined;
  throw new Error(
    [failure?.error ?? `Request failed with ${response.status}`, detail]
      .filter(Boolean)
      .join(" "),
  );
}
