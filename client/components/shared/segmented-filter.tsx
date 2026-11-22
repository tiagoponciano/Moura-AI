import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type SegmentedFilterProps<Value extends string> = {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  /** How many items each option shows, printed beside its name. */
  counts?: Record<Value, number>;
  label: string;
};

/** One choice among a few, as a row of toggles, with an optional count on each. */
export function SegmentedFilter<Value extends string>({
  options,
  value,
  onChange,
  counts,
  label,
}: SegmentedFilterProps<Value>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as Value)}
      spacing={0.5}
      aria-label={label}
      className="flex-wrap rounded-lg bg-muted p-[3px]"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          size="sm"
          className="px-3 text-muted-foreground hover:bg-transparent data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
        >
          {option.label}
          {counts && (
            <span className="text-xs font-normal text-muted-foreground tabular-nums">
              {counts[option.value]}
            </span>
          )}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
