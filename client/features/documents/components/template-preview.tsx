import { cn } from "@/lib/utils";

/** Widths of the fillable slots drawn on the sketch, as a fraction of the row. */
const SLOTS = ["flex-1", "flex-1", "basis-1/3", "flex-1", "basis-1/5"];

const PAPER =
  "flex aspect-[210/297] w-full flex-col gap-2 rounded-md border bg-card px-3.5 py-4 transition-[border-color,transform,box-shadow]";

function Slot({ width }: { width: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1 w-1/3 rounded-sm bg-muted" />
      <span
        className={cn(
          "h-2 rounded-sm border border-dashed border-primary/70 bg-accent",
          width,
        )}
      />
    </span>
  );
}

/** Sketch of an A4 page with its fillable blanks highlighted; decorative only. */
export function TemplatePreview({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn(PAPER, className)}>
      <span className="mx-auto mb-2 h-1.5 w-3/5 rounded-sm bg-muted-foreground/40" />
      {SLOTS.map((width, index) => (
        <Slot key={index} width={width} />
      ))}
      <span className="mt-2 h-1 rounded-sm bg-muted" />
      <span className="h-1 w-5/6 rounded-sm bg-muted" />
      <span className="h-1 w-2/3 rounded-sm bg-muted" />
      <span className="mt-auto">
        <Slot width="basis-1/3" />
      </span>
    </span>
  );
}
