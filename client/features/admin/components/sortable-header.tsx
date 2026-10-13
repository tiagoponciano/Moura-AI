import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortableHeaderProps = {
  label: string;
  sorted: false | "asc" | "desc";
  /** `column.getToggleSortingHandler()`. */
  onToggle: ((event: unknown) => void) | undefined;
};

/** A column header that cycles the column's sort when clicked. */
export function SortableHeader({
  label,
  sorted,
  onToggle,
}: SortableHeaderProps) {
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 uppercase hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      {label}
      <Icon
        className={sorted ? "size-3.5" : "size-3.5 opacity-50"}
        aria-hidden
      />
      <span className="sr-only">
        {sorted === "asc"
          ? "(ordem crescente)"
          : sorted === "desc"
            ? "(ordem decrescente)"
            : "(ordenar)"}
      </span>
    </button>
  );
}
