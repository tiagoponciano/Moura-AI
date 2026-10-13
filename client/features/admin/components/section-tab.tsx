import type { LucideIcon } from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type SectionTabProps = {
  value: string;
  icon: LucideIcon;
  label: string;
  summary: string;
  /** Draws the summary in the accent color, e.g. users awaiting approval. */
  highlight?: boolean;
};

/** A section of the console as a card: icon, name and its current state in one line. */
export function SectionTab({
  value,
  icon: Icon,
  label,
  summary,
  highlight = false,
}: SectionTabProps) {
  return (
    <TabsTrigger
      value={value}
      className="group h-auto min-w-0 flex-[1_1_220px] items-start justify-start gap-3 rounded-xl border-border bg-card px-4 py-3.5 text-left whitespace-normal text-foreground transition-[border-color,box-shadow] hover:border-foreground/20 data-active:border-primary data-active:bg-card data-active:ring-3 data-active:ring-primary/15 group-data-[variant=default]/tabs-list:data-active:shadow-none dark:text-foreground dark:data-active:border-primary dark:data-active:bg-card"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-data-active:bg-accent group-data-active:text-accent-foreground">
        <Icon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{label}</span>
        <span
          className={cn(
            "truncate text-[13px] font-normal",
            highlight ? "text-accent-foreground" : "text-muted-foreground",
          )}
        >
          {summary}
        </span>
      </span>
    </TabsTrigger>
  );
}
