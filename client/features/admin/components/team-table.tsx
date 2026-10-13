"use client";

import { useTable, type SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TEAM_FILTERS, type TeamFilter } from "../lib/labels";
import { matchesTeamQuery, TEAM_TABLE_FEATURES } from "../lib/team-table";
import type { AdminUser, UserChange } from "../lib/types";
import { countByStatus } from "../lib/users";
import { buildTeamColumns } from "./team-columns";

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
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar por nome ou e-mail"
            className="w-60 pl-8"
          />
        </div>
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => value && setFilter(value as TeamFilter)}
          spacing={0.5}
          aria-label="Filtrar por status"
          className="rounded-lg bg-muted p-[3px]"
        >
          {TEAM_FILTERS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              size="sm"
              className="px-3 text-muted-foreground hover:bg-transparent data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {option.label}
              <span className="text-xs font-normal text-muted-foreground">
                {filterCount[option.value]}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
