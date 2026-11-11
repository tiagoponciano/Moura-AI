import { ExternalLink, FileText } from "lucide-react";
import type { SelectedFloorPlan } from "../hooks/use-floor-plan";

/** The chosen plan: a PDF in the browser's own viewer, an image as it is. */
export function PlanPreview({ plan }: { plan: SelectedFloorPlan }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium">{plan.name}</span>
        <a
          href={plan.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Abrir em nova aba"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>
      </div>
      {plan.isImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- a blob URL, not a remote image
        <img
          src={plan.url}
          alt={`Prévia de ${plan.name}`}
          className="w-full rounded-lg border bg-muted object-contain"
        />
      ) : (
        <iframe
          src={plan.url}
          title={`Prévia de ${plan.name}`}
          className="aspect-[3/4] w-full rounded-lg border bg-muted"
        />
      )}
    </div>
  );
}
