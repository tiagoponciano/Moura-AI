import type { ProfileRole, ProfileStatus } from "@/lib/auth/gate";

export const STATUS_LABEL: Record<ProfileStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export const ROLE_LABEL: Record<ProfileRole, string> = {
  admin: "Admin",
  member: "Membro",
};
