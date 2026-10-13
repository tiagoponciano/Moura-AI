import { Badge } from "@/components/ui/badge";
import type { CatalogProvider } from "@/lib/llm/catalog";
import { cn } from "@/lib/utils";
import type { ProviderKeyHint } from "../lib/types";

type ProviderCardProps = {
  provider: CatalogProvider;
  hint: ProviderKeyHint | undefined;
  selected: boolean;
  /** The provider the chats use right now. */
  inUse: boolean;
  onSelect: () => void;
};

/** A provider to pick, with whether it has a key and whether it is in use. */
export function ProviderCard({
  provider,
  hint,
  selected,
  inUse,
  onSelect,
}: ProviderCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-[1_1_180px] flex-col gap-1.5 rounded-lg border bg-card p-3.5 text-left transition-[border-color,box-shadow] hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected &&
          "border-primary ring-3 ring-primary/12 hover:border-primary",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{provider.label}</span>
        {inUse && (
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground"
          >
            Em uso
          </Badge>
        )}
      </span>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn(
            "size-1.5 rounded-full",
            hint ? "bg-success" : "bg-muted-foreground/50",
          )}
        />
        <span className="font-mono">
          {hint ? `Chave ••••${hint.lastFour}` : "Sem chave"}
        </span>
      </span>
    </button>
  );
}
