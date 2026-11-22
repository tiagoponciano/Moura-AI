"use client";

import {
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { SearchField } from "@/components/shared/search-field";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/projects/project";
import {
  PROJECTS_PAGE_SIZE,
  PROJECTS_TABLE_FEATURES,
  globalProjectFilter,
  pageRange,
  toProjectRows,
} from "../lib/projects-table";
import { PROJECT_COLUMNS } from "./projects-columns";

/** The team's projects: search by name, city or occupation, sort by a column, ten to a page. */
export function ProjectsTable({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PROJECTS_PAGE_SIZE,
  });
  const data = useMemo(() => toProjectRows(projects), [projects]);

  const table = useTable({
    features: PROJECTS_TABLE_FEATURES,
    columns: PROJECT_COLUMNS,
    data,
    state: { globalFilter: query, sorting, pagination },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn: globalProjectFilter,
    getColumnCanGlobalFilter: (column) => column.id === "name",
  });

  const rows = table.getRowModel().rows;
  const range = pageRange(
    pagination.pageIndex,
    pagination.pageSize,
    table.getFilteredRowModel().rows.length,
  );

  return (
    <section className="flex flex-col gap-3" aria-label="Lista de projetos">
      <SearchField
        value={query}
        onChange={(next) => {
          setQuery(next);
          setPagination((current) => ({ ...current, pageIndex: 0 }));
        }}
        placeholder="Buscar por nome, cidade ou ocupação"
        label="Buscar projeto"
        className="sm:w-80"
      />
      <div className="rounded-xl border bg-card">
        <Table className="min-w-[560px]">
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
                  colSpan={PROJECT_COLUMNS.length}
                  className="px-5 py-7 text-center text-muted-foreground"
                >
                  Nenhum projeto encontrado.
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
      {range && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">{range}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
