import {
  columnFilteringFeature,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowSortingFeature,
  tableFeatures,
  type FilterFn,
  type SortFn,
} from "@tanstack/react-table";
import type { TeamFilter } from "./labels";
import type { AdminUser } from "./types";
import { matchesUserQuery } from "./users";

/** Client-side search, status filter and sorting; the list is small and already loaded. */
export const TEAM_TABLE_FEATURES = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

type TeamFeatures = typeof TEAM_TABLE_FEATURES;

/** Global filter: the search box value against name and e-mail. */
export const matchesTeamQuery: FilterFn<TeamFeatures, AdminUser> = (
  row,
  _columnId,
  query,
) => matchesUserQuery(row.original, String(query ?? ""));

/** Status column filter; `"all"` keeps every row. */
export const matchesTeamFilter: FilterFn<TeamFeatures, AdminUser> = (
  row,
  columnId,
  filter: TeamFilter,
) => filter === "all" || row.getValue(columnId) === filter;

/** Ascending `localeCompare` in pt-BR; the table reverses it for descending order. */
export const compareText: SortFn<TeamFeatures, AdminUser> = (a, b, columnId) =>
  String(a.getValue(columnId)).localeCompare(
    String(b.getValue(columnId)),
    "pt-BR",
  );
