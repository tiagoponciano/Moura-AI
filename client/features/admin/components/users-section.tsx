"use client";

import { useMemo } from "react";
import type { AdminUsersResponse, UserChange } from "../lib/types";
import { PendingUserCard } from "./pending-user-card";
import { TeamTable } from "./team-table";

type UsersSectionProps = {
  data: AdminUsersResponse;
  busyId: string | undefined;
  onChange: (id: string, change: UserChange) => void;
};

/** Sign-ups awaiting approval as cards, then everyone else in the team table. */
export function UsersSection({ data, busyId, onChange }: UsersSectionProps) {
  const pending = useMemo(
    () => data.users.filter((user) => user.status === "pending"),
    [data.users],
  );
  const team = useMemo(
    () => data.users.filter((user) => user.status !== "pending"),
    [data.users],
  );

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <section
          aria-labelledby="pending-title"
          className="flex flex-col gap-3"
        >
          <div className="flex items-baseline gap-2">
            <h2 id="pending-title" className="text-base font-semibold">
              Aguardando aprovação
            </h2>
            <span className="text-xs text-muted-foreground">
              {pending.length}
            </span>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-3">
            {pending.map((user) => (
              <PendingUserCard
                key={user.id}
                user={user}
                busy={busyId === user.id}
                disabled={busyId !== undefined}
                onChange={(change) => onChange(user.id, change)}
              />
            ))}
          </ul>
        </section>
      )}
      <TeamTable
        users={team}
        currentUserId={data.currentUserId}
        busyId={busyId}
        onChange={onChange}
      />
    </div>
  );
}
