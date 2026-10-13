import type { ProfileRole, ProfileStatus } from "@/lib/auth/gate";
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

/** `GET /api/admin/settings`. */
export type AdminSettingsResponse = {
  settings: {
    provider: LlmProvider | null;
    model: string | null;
    allowedEmailDomain: string | null;
    updatedAt: string;
  };
  keys: ProviderKeyHint[];
  /** Without the service role key the chat routes ignore these settings. */
  serviceRoleConfigured: boolean;
};
