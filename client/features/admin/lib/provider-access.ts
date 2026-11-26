import type { ProviderAccess } from "./types";

/** Adds the user to the list, or removes them when already there. */
export function toggleUser(userIds: string[], userId: string): string[] {
  return userIds.includes(userId)
    ? userIds.filter((id) => id !== userId)
    : [...userIds, userId];
}

/** Whether the choice on screen differs from what is saved (no row saved means open to everyone). */
export function accessChanged(
  saved: ProviderAccess | undefined,
  restricted: boolean,
  userIds: string[],
): boolean {
  const savedRestricted = saved?.restricted ?? false;
  if (savedRestricted !== restricted) return true;
  if (!restricted) return false;
  const before = new Set(saved?.userIds ?? []);
  return (
    before.size !== userIds.length || userIds.some((id) => !before.has(id))
  );
}

/** One line under the provider: who can use it. */
export function describeAccess(restricted: boolean, count: number): string {
  if (!restricted) return "Todos os usuários aprovados podem usar.";
  if (count === 0) return "Ninguém pode usar este provedor.";
  return count === 1
    ? "Só 1 usuário pode usar."
    : `Só ${count} usuários podem usar.`;
}
