import { createColumnHelper } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Badge } from "@/components/ui/badge";
import { formLabel } from "@/lib/cbmsc-forms/catalog";
import {
  compareFormRows,
  compareStartedAt,
  type FORMS_TABLE_FEATURES,
  type FormRow,
} from "../lib/forms-table";

const helper = createColumnHelper<typeof FORMS_TABLE_FEATURES, FormRow>();

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Formulário (with its IN and annex), Assistente, Iniciado em; the row opens the form. */
export const FORMS_COLUMNS = helper.columns([
  helper.accessor((row) => row.form.name, {
    id: "name",
    sortFn: compareFormRows,
    header: ({ column }) => (
      <SortableHeader
        label="Formulário"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ row, getValue }) => (
      <span className="flex flex-col font-medium">
        {getValue()}
        <span className="text-xs font-normal text-muted-foreground">
          {formLabel(row.original.form)}
        </span>
      </span>
    ),
  }),
  helper.accessor((row) => Boolean(row.template), {
    id: "assistant",
    enableSorting: false,
    header: () => <span className="uppercase">Assistente</span>,
    cell: ({ getValue }) =>
      getValue() ? (
        <Badge variant="secondary">Disponível</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  }),
  helper.accessor((row) => row.startedAt ?? "", {
    id: "startedAt",
    sortFn: compareStartedAt,
    header: ({ column }) => (
      <SortableHeader
        label="Iniciado em"
        sorted={column.getIsSorted()}
        onToggle={column.getToggleSortingHandler()}
      />
    ),
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? (
        <span className="text-muted-foreground tabular-nums">
          {dateTime.format(new Date(value))}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  }),
  helper.display({
    id: "open",
    header: () => <span className="sr-only">Abrir</span>,
    cell: () => (
      <ChevronRight
        className="ml-auto size-4 text-muted-foreground"
        aria-hidden
      />
    ),
  }),
]);
