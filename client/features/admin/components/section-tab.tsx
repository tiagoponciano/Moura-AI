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

/** A section of the console as a flat tab: icon, name and its current state in one line, underlined when open. */
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
      className="group h-auto min-w-0 flex-none items-start justify-start gap-2.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-4 py-3 text-left whitespace-normal text-muted-foreground transition-colors hover:text-foreground data-active:border-primary data-active:bg-transparent data-active:text-foreground data-active:shadow-none dark:data-active:border-primary dark:data-active:bg-transparent"
    >
      <Icon className="mt-0.5 size-4 shrink-0 group-data-active:text-primary" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        <span
          className={cn(
            "truncate text-xs font-normal",
            highlight ? "text-primary" : "text-muted-foreground",
          )}
        >
          {summary}
        </span>
      </span>
    </TabsTrigger>
  );
}
