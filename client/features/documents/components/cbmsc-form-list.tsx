import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { NormativeGroup } from "@/lib/cbmsc-forms/catalog";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { cn } from "@/lib/utils";

type CbmscFormListProps = {
  query: string;
  onQueryChange: (query: string) => void;
  groups: NormativeGroup<CbmscForm>[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

/** Search field and the forms grouped by IN. */
export function CbmscFormList({
  query,
  onQueryChange,
  groups,
  selectedId,
  onSelect,
}: CbmscFormListProps) {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar por IN, anexo ou nome"
          className="pl-8"
          aria-label="Buscar formulário"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            Nenhum formulário encontrado.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.normative} className="mb-4">
              <h3 className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                IN {group.normative}
              </h3>
              <ul>
                {group.forms.map((form) => (
                  <li key={form.googleDocId}>
                    <button
                      type="button"
                      onClick={() => onSelect(form.googleDocId)}
                      className={cn(
                        "flex w-full flex-col rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        form.googleDocId === selectedId &&
                          "bg-accent text-accent-foreground hover:bg-accent",
                      )}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Anexo {form.annex}
                      </span>
                      <span>{form.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
