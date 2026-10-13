import { createColumnHelper } from "@tanstack/react-table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ROLE_LABEL, STATUS_LABEL } from "../lib/labels";
import {
  compareText,
  matchesTeamFilter,
  type TEAM_TABLE_FEATURES,
} from "../lib/team-table";
import type { AdminUser, UserChange } from "../lib/types";
import { SortableHeader } from "./sortable-header";
import { UserActions } from "./user-actions";

const helper = createColumnHelper<typeof TEAM_TABLE_FEATURES, AdminUser>();

type TeamColumnsInput = {
  currentUserId: string;
  /** The row being saved; every action is disabled meanwhile. */
  busyId: string | undefined;
  onChange: (id: string, change: UserChange) => void;
};

/** Usuário, Status, Função, Desde and Ações; Usuário and Desde sort on click. */
export function buildTeamColumns({
  currentUserId,
  busyId,
  onChange,
}: TeamColumnsInput) {
  return helper.columns([
    helper.accessor((user) => user.name ?? user.email, {
      id: "user",
      sortFn: compareText,
      header: ({ column }) => (
        <SortableHeader
          label="Usuário"
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ row, getValue }) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={getValue()} avatarUrl={row.original.avatarUrl} />
          <div className="grid min-w-0 leading-snug">
            <span className="truncate font-medium">
              {getValue()}
              {row.original.id === currentUserId && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  (você)
                </span>
              )}
            </span>
            <span className="truncate text-[13px] text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        </div>
      ),
    }),
    helper.accessor("status", {
      header: "Status",
      enableSorting: false,
      filterFn: matchesTeamFilter,
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              getValue() === "approved" ? "bg-success" : "bg-muted-foreground",
            )}
          />
          {STATUS_LABEL[getValue()]}
        </Badge>
      ),
    }),
    helper.accessor("role", {
      header: "Função",
      enableSorting: false,
      cell: ({ getValue }) => (
        <Badge
          variant="secondary"
          className={cn(
            getValue() === "admin" && "bg-accent text-accent-foreground",
          )}
        >
          {ROLE_LABEL[getValue()]}
        </Badge>
      ),
    }),
    helper.accessor("createdAt", {
      id: "createdAt",
      sortFn: compareText,
      sortDescFirst: true,
      header: ({ column }) => (
        <SortableHeader
          label="Desde"
          sorted={column.getIsSorted()}
          onToggle={column.getToggleSortingHandler()}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDateTime(getValue())}
        </span>
      ),
    }),
    helper.display({
      id: "actions",
      header: () => <span className="block text-right">Ações</span>,
      cell: ({ row }) => (
        <UserActions
          user={row.original}
          isSelf={row.original.id === currentUserId}
          busy={busyId === row.original.id}
          disabled={busyId !== undefined}
          onChange={(change) => onChange(row.original.id, change)}
        />
      ),
    }),
  ]);
}
