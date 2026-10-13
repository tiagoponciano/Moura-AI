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
