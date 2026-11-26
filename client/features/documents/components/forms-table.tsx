"use client";

import {
  useTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { SearchField } from "@/components/shared/search-field";
import { SegmentedFilter } from "@/components/shared/segmented-filter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pageRange } from "@/lib/page-range";
import {
  FORMS_PAGE_SIZE,
  FORMS_TABLE_FEATURES,
  FORM_FILTERS,
  countFormRows,
  filterFormRows,
  globalFormFilter,
  type FormFilter,
  type FormRow,
} from "../lib/forms-table";
import { FORMS_COLUMNS } from "./forms-columns";

type FormsTableProps = {
  rows: FormRow[];
  onOpen: (row: FormRow) => void;
};

/** The official forms: search, filter by started or with an assistant, sort, a dozen to a page. */
export function FormsTable({ rows, onOpen }: FormsTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FormFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: FORMS_PAGE_SIZE,
  });
  const counts = useMemo(() => countFormRows(rows), [rows]);
  const data = useMemo(() => filterFormRows(rows, filter), [rows, filter]);
  const backToFirstPage = () =>
    setPagination((current) => ({ ...current, pageIndex: 0 }));

  const table = useTable({
    features: FORMS_TABLE_FEATURES,
    columns: FORMS_COLUMNS,
    data,
    state: { globalFilter: query, sorting, pagination },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn: globalFormFilter,
    getColumnCanGlobalFilter: (column) => column.id === "name",
  });

  const visible = table.getRowModel().rows;
  const range = pageRange(
    pagination.pageIndex,
    pagination.pageSize,
    table.getFilteredRowModel().rows.length,
  );

  return (
    <section className="flex flex-col gap-3" aria-label="Formulários do CBMSC">
      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={(next) => {
            setQuery(next);
            backToFirstPage();
          }}
          placeholder="Buscar por IN, anexo ou nome"
          label="Buscar formulário"
          className="sm:w-80"
        />
        <SegmentedFilter
          label="Filtrar formulários"
          options={FORM_FILTERS}
          value={filter}
          counts={counts}
          onChange={(next) => {
            setFilter(next);
            backToFirstPage();
          }}
        />
      </div>
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
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={FORMS_COLUMNS.length}
                  className="px-5 py-7 text-center text-muted-foreground"
                >
                  Nenhum formulário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  className="cursor-pointer outline-none focus-visible:bg-muted"
                  onClick={() => onOpen(row.original)}
                  onKeyDown={(event) =>
                    event.key === "Enter" && onOpen(row.original)
                  }
                >
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
