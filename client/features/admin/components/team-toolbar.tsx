import { SearchField } from "@/components/shared/search-field";
import { SegmentedFilter } from "@/components/shared/segmented-filter";
import { TEAM_FILTERS, type TeamFilter } from "../lib/labels";

type TeamToolbarProps = {
  query: string;
  onQuery: (query: string) => void;
  filter: TeamFilter;
  onFilter: (filter: TeamFilter) => void;
  counts: Record<TeamFilter, number>;
};

/** The search box and the status filter above the team table. */
export function TeamToolbar({
  query,
  onQuery,
  filter,
  onFilter,
  counts,
}: TeamToolbarProps) {
  return (
    <>
      <SearchField
        value={query}
        onChange={onQuery}
        placeholder="Buscar por nome ou e-mail"
      />
      <SegmentedFilter
        options={TEAM_FILTERS}
        value={filter}
        onChange={onFilter}
        counts={counts}
        label="Filtrar por status"
      />
    </>
  );
}
