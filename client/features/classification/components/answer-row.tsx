import type { ReactNode } from "react";
import { SourceTagBadge } from "@/components/shared/source-tag-badge";
import { Label } from "@/components/ui/label";
import type { sourceTag } from "@/lib/field-sources";
import { cn } from "@/lib/utils";

type AnswerRowProps = {
  id: string;
  label: string;
  filled: boolean;
  tag: ReturnType<typeof sourceTag>;
  children: ReactNode;
};

/** A labelled row of the building form, with its filled mark and where the answer came from. */
export function AnswerRow({
  id,
  label,
  filled,
  tag,
  children,
}: AnswerRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[8px_minmax(0,1fr)] gap-x-3 gap-y-0.5 rounded-lg px-2 py-1.5 transition-colors focus-within:bg-accent hover:bg-muted focus-within:hover:bg-accent",
        !filled &&
          "[&_[data-placeholder]]:text-muted-foreground/60 [&_input]:placeholder:text-muted-foreground/60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 rounded-full border-[1.5px] border-input",
          filled && "border-0 bg-success",
        )}
      />
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs leading-snug font-normal text-muted-foreground"
      >
        {label}
        {tag && <SourceTagBadge tag={tag} />}
      </Label>
      <div className="col-start-2">{children}</div>
    </div>
  );
}
