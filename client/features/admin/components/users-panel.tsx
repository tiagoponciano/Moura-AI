"use client";

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfileStatus } from "@/lib/auth/gate";
import { useAdminUsers } from "../hooks/use-admin-users";
import { STATUS_LABEL } from "../lib/labels";
import { countPending, filterUsers, type UserStatusFilter } from "../lib/users";
import { UserRow } from "./user-row";

/** Every profile, pending first, with approve/reject/revoke and role changes. */
export function UsersPanel() {
  const { data, error, busyId, change } = useAdminUsers();
  const [filter, setFilter] = useState<UserStatusFilter>("all");

  const users = data ? filterUsers(data.users, filter) : [];
  const pendingCount = data ? countPending(data.users) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
        <CardDescription>
          {pendingCount > 0
            ? `${pendingCount} aguardando aprovação.`
            : "Ninguém aguardando aprovação."}
        </CardDescription>
        <CardAction>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as UserStatusFilter)}
          >
            <SelectTrigger size="sm" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(Object.keys(STATUS_LABEL) as ProfileStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error && (
          <p role="alert" className="pb-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {!data ? (
          !error && <Skeleton className="h-24 w-full" />
        ) : users.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            Nenhum usuário neste filtro.
          </p>
        ) : (
          <ul className="divide-y">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === data.currentUserId}
                busy={busyId === user.id}
                disabled={busyId !== undefined}
                onChange={(update) => change(user.id, update)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
