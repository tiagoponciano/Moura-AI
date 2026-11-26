import type { ProfileRole, ProfileStatus } from "@/lib/auth/gate";
import type {
  CbmscForm,
  CbmscFormDraft,
  SiteCheck,
} from "@/lib/cbmsc-forms/types";
import type { LlmProvider } from "@/lib/llm/catalog";

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  status: ProfileStatus;
  role: ProfileRole;
  approvedAt: string | null;
  createdAt: string;
};

/** Body of `PATCH /api/admin/users/:id`: what the console can change on a profile. */
export type UserChange = Partial<Pick<AdminUser, "status" | "role">>;

/** `GET /api/admin/users`. */
export type AdminUsersResponse = {
  users: AdminUser[];
  /** The caller; the console disables actions on this row. */
  currentUserId: string;
};

export type ProviderKeyHint = {
  provider: LlmProvider;
  lastFour: string;
  updatedAt: string;
};

/** Who may use a provider: everyone, or only the listed users when `restricted`. */
export type ProviderAccess = {
  provider: LlmProvider;
  restricted: boolean;
  userIds: string[];
};

/** `GET /api/admin/settings`. */
export type AdminSettingsResponse = {
  settings: {
    provider: LlmProvider | null;
    model: string | null;
    allowedEmailDomain: string | null;
    updatedAt: string;
  };
  keys: ProviderKeyHint[];
  access: ProviderAccess[];
  /** Without the service role key the chat routes ignore these settings. */
  serviceRoleConfigured: boolean;
};

/** `GET /api/admin/forms`. */
export type AdminFormsResponse = { forms: CbmscForm[] };

/** `POST /api/admin/forms/resolve`. */
export type ResolveFormLinkResponse = { drafts: CbmscFormDraft[] };

/** `GET` and `POST /api/admin/forms/site-check`; `null` before the first check. */
export type SiteCheckResponse = { check: SiteCheck | null };

/** One norm the classification is built on; see `GET /api/admin/norms`. */
export type AdminNormSource = {
  doc: string;
  sourceUrl: string;
  /** Date of the extraction, `YYYY-MM-DD`. */
  retrieved: string;
  pages: number;
  /** Items a person still has to check against the printed norm. */
  needsHumanLook: number;
};

/** `GET /api/admin/norms`. */
export type AdminNormsResponse = { norms: AdminNormSource[] };
