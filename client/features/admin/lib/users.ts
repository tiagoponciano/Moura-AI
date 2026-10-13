import type { ProfileStatus } from "@/lib/auth/gate";
import type { AdminUser } from "./types";

/** The users panel's status filter. */
export type UserStatusFilter = ProfileStatus | "all";

const STATUS_ORDER: Record<ProfileStatus, number> = {
  pending: 0,
  approved: 1,
  rejected: 2,
};

/** Pending first, then approved, then rejected; newest first within each. */
export function sortUsers(users: AdminUser[]): AdminUser[] {
  return [...users].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

/** The users with `filter`'s status, in their original order; every user for `"all"`. */
export function filterUsers(
  users: AdminUser[],
  filter: UserStatusFilter,
): AdminUser[] {
  return filter === "all"
    ? users
    : users.filter((user) => user.status === filter);
}

export function countPending(users: AdminUser[]): number {
  return users.filter((user) => user.status === "pending").length;
}

export function countByStatus(
  users: AdminUser[],
): Record<ProfileStatus, number> {
  const counts: Record<ProfileStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const user of users) counts[user.status] += 1;
  return counts;
}

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Whether `query` appears in the user's name or e-mail, ignoring case and accents; a blank query matches everyone. */
export function matchesUserQuery(user: AdminUser, query: string): boolean {
  const needle = normalize(query.trim());
  if (!needle) return true;
  return normalize(`${user.name ?? ""} ${user.email}`).includes(needle);
}
