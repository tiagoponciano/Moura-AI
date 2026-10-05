import { FileText } from "lucide-react";
import type { TemplateEntry } from "@/features/documents/lib/templates";

type TemplatePickerProps = {
  templates: TemplateEntry[];
  onSelect: (id: string) => void;
};

/** Card grid shown while no template is selected. */
export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <p className="text-sm font-medium">
        Qual documento você precisa preencher?
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                Modelo .{entry.type}
              </p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Os modelos oficiais dos anexos ainda serão adicionados. Por enquanto há
        apenas um formulário de exemplo.
      </p>
    </div>
  );
}
