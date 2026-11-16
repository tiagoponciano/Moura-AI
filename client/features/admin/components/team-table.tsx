"use client";

import { useTable, type SortingState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TeamFilter } from "../lib/labels";
import { matchesTeamQuery, TEAM_TABLE_FEATURES } from "../lib/team-table";
import type { AdminUser, UserChange } from "../lib/types";
import { countByStatus } from "../lib/users";
import { buildTeamColumns } from "./team-columns";
import { TeamToolbar } from "./team-toolbar";

type TeamTableProps = {
  /** Approved and rejected users; pending ones are listed above the table. */
  users: AdminUser[];
  currentUserId: string;
  busyId: string | undefined;
  onChange: (id: string, change: UserChange) => void;
};

/** "Equipe": search by name or e-mail, filter by status and sort by name or date. */
export function TeamTable({
  users,
  currentUserId,
  busyId,
  onChange,
}: TeamTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TeamFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => buildTeamColumns({ currentUserId, busyId, onChange }),
    [currentUserId, busyId, onChange],
  );
  const columnFilters = useMemo(
    () => (filter === "all" ? [] : [{ id: "status", value: filter }]),
    [filter],
  );

  const table = useTable({
    features: TEAM_TABLE_FEATURES,
    columns,
    data: users,
    state: { globalFilter: query, columnFilters, sorting },
    onGlobalFilterChange: setQuery,
    onSortingChange: setSorting,
    globalFilterFn: matchesTeamQuery,
    getColumnCanGlobalFilter: (column) => column.id === "user",
  });

  const counts = countByStatus(users);
  const filterCount: Record<TeamFilter, number> = {
    all: users.length,
    approved: counts.approved,
    rejected: counts.rejected,
  };
  const rows = table.getRowModel().rows;

  return (
    <section aria-labelledby="team-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="team-title" className="flex-1 text-base font-semibold">
          Equipe
        </h2>
        <TeamToolbar
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          counts={filterCount}
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="px-5 py-7 text-center text-muted-foreground"
                >
                  Ninguém encontrado com esse filtro.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
