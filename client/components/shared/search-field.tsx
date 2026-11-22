import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** What assistive technology reads; the placeholder when absent. */
  label?: string;
  className?: string;
};

/** A search box with a magnifier, for the toolbar above a list or a table. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        autoComplete="off"
        className="pl-8"
      />
    </div>
  );
}
