import type { SourceTag } from "@/lib/field-sources";
import { cn } from "@/lib/utils";

/** "IA" or "editado" pill shown next to a field label. */
export function SourceTagBadge({ tag }: { tag: SourceTag }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 text-[10px] leading-4 font-medium",
        tag === "IA"
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {tag}
    </span>
  );
}
