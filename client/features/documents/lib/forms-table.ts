import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type FilterFn,
  type SortFn,
} from "@tanstack/react-table";
import { compareForms } from "@/lib/cbmsc-forms/catalog";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { filterForms, findFormTemplate } from "./cbmsc-forms";
import type { Filling } from "./fillings";
import type { TemplateEntry } from "./templates";

/** What one row of the forms table shows. */
export type FormRow = {
  form: CbmscForm;
  /** The tagged copy the assistant fills; absent when the form has none yet. */
  template?: TemplateEntry;
  /** When the form was last saved in the selected project. */
  startedAt?: string;
};

export const FORMS_PAGE_SIZE = 12;

/** Client-side search, sorting and pages; the catalog is small and already loaded. */
export const FORMS_TABLE_FEATURES = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

type FormsFeatures = typeof FORMS_TABLE_FEATURES;

export const FORM_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "started", label: "Iniciados" },
  { value: "assistant", label: "Com assistente" },
] as const;

export type FormFilter = (typeof FORM_FILTERS)[number]["value"];

/** One row per form in the catalog, in IN and annex order, with its template and when it was started. */
export function toFormRows(
  forms: CbmscForm[],
  templates: TemplateEntry[],
  fillings: Filling[],
): FormRow[] {
  const started = new Map<string, string>();
  for (const { template_id, updated_at } of fillings) {
    const known = started.get(template_id);
    if (!known || updated_at > known) started.set(template_id, updated_at);
  }
  return [...forms].sort(compareForms).map((form) => {
    const template = findFormTemplate(templates, form);
    return {
      form,
      template,
      startedAt: template ? started.get(template.id) : undefined,
    };
  });
}

/** The rows a filter keeps. */
export function filterFormRows(rows: FormRow[], filter: FormFilter): FormRow[] {
  if (filter === "started") return rows.filter((row) => row.startedAt);
  if (filter === "assistant") return rows.filter((row) => row.template);
  return rows;
}

export function countFormRows(rows: FormRow[]): Record<FormFilter, number> {
  return {
    all: rows.length,
    started: filterFormRows(rows, "started").length,
    assistant: filterFormRows(rows, "assistant").length,
  };
}

/** Global filter: every word of the search box in "IN n Anexo X name". */
export const globalFormFilter: FilterFn<FormsFeatures, FormRow> = (
  row,
  _columnId,
  query,
) => filterForms([row.original.form], String(query ?? "")).length > 0;

/** IN, then annex, then name. */
export const compareFormRows: SortFn<FormsFeatures, FormRow> = (a, b) =>
  compareForms(a.original.form, b.original.form);

/** Oldest first; a form never started sorts before any date. */
export const compareStartedAt: SortFn<FormsFeatures, FormRow> = (a, b) =>
  (a.original.startedAt ?? "").localeCompare(b.original.startedAt ?? "");
