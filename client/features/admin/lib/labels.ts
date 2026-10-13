import type { ProfileRole, ProfileStatus } from "@/lib/auth/gate";

/** "Sem acesso" covers both a rejected request and revoked access. */
export const STATUS_LABEL: Record<ProfileStatus, string> = {
  pending: "Pendente",
  approved: "Ativo",
  rejected: "Sem acesso",
};

export const ROLE_LABEL: Record<ProfileRole, string> = {
  admin: "Admin",
  member: "Membro",
};

/** The team table's status filter; pending users are listed above the table instead. */
export type TeamFilter = "all" | "approved" | "rejected";

export const TEAM_FILTERS: { value: TeamFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Ativos" },
  { value: "rejected", label: "Sem acesso" },
];
