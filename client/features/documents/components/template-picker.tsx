import type { TemplateEntry } from "../lib/templates";
import { TemplatePreview } from "./template-preview";

type TemplatePickerProps = {
  templates: TemplateEntry[];
  onSelect: (id: string) => void;
};

/** Gallery of page sketches shown while no template is selected. */
export function TemplatePicker({ templates, onSelect }: TemplatePickerProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b bg-sidebar px-4 py-8 md:px-8 md:py-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              Novo documento
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Escolha um modelo, descreva o imóvel na conversa e baixe o .docx
              com o layout original.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fill,11rem)] sm:gap-5">
            {templates.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onSelect(entry.id)}
                className="group flex flex-col gap-2.5 text-left focus-visible:outline-none"
              >
                <TemplatePreview className="group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md group-focus-visible:border-primary group-focus-visible:ring-3 group-focus-visible:ring-ring/50" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{entry.name}</span>
                  <span className="w-fit rounded border px-1.5 font-mono text-[11px] text-muted-foreground">
                    .{entry.type}
                  </span>
                </span>
              </button>
            ))}
            <div className="flex flex-col gap-2.5">
              <span className="flex aspect-[210/297] w-full items-center justify-center rounded-md border border-dashed px-4 text-center text-xs text-muted-foreground">
                Anexos do CBMSC em breve
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Modelos oficiais
                </span>
                <span className="text-xs text-muted-foreground">
                  Ainda não disponíveis
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
