import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Buscar por nome ou e-mail"
          aria-label="Buscar por nome ou e-mail"
          className="w-60 pl-8"
        />
      </div>
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(value) => value && onFilter(value as TeamFilter)}
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
              {counts[option.value]}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  );
}
