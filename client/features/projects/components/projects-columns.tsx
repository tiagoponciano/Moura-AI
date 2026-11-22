import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Badge } from "@/components/ui/badge";
import { formatArea } from "../lib/project-summary";
import {
  compareProjectArea,
  compareProjectText,
  type PROJECTS_TABLE_FEATURES,
  type ProjectRow,
} from "../lib/projects-table";

const helper = createColumnHelper<typeof PROJECTS_TABLE_FEATURES, ProjectRow>();

const blank = <span className="text-muted-foreground">—</span>;

/** Projeto (with its city), Ocupação and Área; each sorts on click. */
export const PROJECT_COLUMNS = helper.columns([
  helper.accessor((row) => row.project.name, {
    id: "name",
    sortFn: compareProjectText,
    header: ({ column }) => (
      <SortableHeader
        label="Projeto"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row, getValue }) => (
      <Link
        href={`/projects/${row.original.project.id}`}
        className="flex flex-col font-medium outline-none hover:underline focus-visible:underline"
      >
        {getValue()}
        {row.original.city && (
          <span className="text-xs font-normal text-muted-foreground">
            {row.original.city}
          </span>
        )}
      </Link>
    ),
  }),
  helper.accessor((row) => row.occupancy, {
    id: "occupancy",
    sortFn: compareProjectText,
    header: ({ column }) => (
      <SortableHeader
        label="Ocupação"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => {
      const occupancy = getValue();
      return occupancy ? <Badge variant="secondary">{occupancy}</Badge> : blank;
    },
  }),
  helper.accessor((row) => row.area, {
    id: "area",
    sortFn: compareProjectArea,
    header: ({ column }) => (
      <SortableHeader
        label="Área"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => {
      const area = getValue();
      return area === undefined ? (
        blank
      ) : (
        <span className="text-muted-foreground tabular-nums">
          {formatArea(String(area))}
        </span>
      );
    },
  }),
]);
