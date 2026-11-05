"use client";

import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCbmscForms } from "../hooks/use-cbmsc-forms";
import { findFormTemplate } from "../lib/cbmsc-forms";
import type { TemplateEntry } from "../lib/templates";
import { CbmscFormList } from "./cbmsc-form-list";
import { CbmscFormPreview } from "./cbmsc-form-preview";

type CbmscFormsBrowserProps = {
  templates: TemplateEntry[];
  onFill: (templateId: string) => void;
};

/** List on the left, preview on the right; one at a time below `lg`. */
export function CbmscFormsBrowser({
  templates,
  onFill,
}: CbmscFormsBrowserProps) {
  const catalog = useCbmscForms();

  if (catalog.error) {
    return (
      <p role="alert" className="p-6 text-sm text-destructive">
        {catalog.error}
      </p>
    );
  }
  if (catalog.loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Carregando formulários…
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div
        className={cn(
          "flex min-h-0 flex-col",
          catalog.selected && "hidden lg:flex",
        )}
      >
        <CbmscFormList
          query={catalog.query}
          onQueryChange={catalog.setQuery}
          groups={catalog.groups}
          selectedId={catalog.selected?.googleDocId}
          onSelect={catalog.select}
        />
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-col",
          !catalog.selected && "hidden lg:flex",
        )}
      >
        {catalog.selected ? (
          <CbmscFormPreview
            key={catalog.selected.googleDocId}
            form={catalog.selected}
            template={findFormTemplate(templates, catalog.selected)}
            onFill={onFill}
            onBack={catalog.clearSelection}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
            <FileText className="size-6" />
            Escolha um formulário para ver a versão atual.
          </div>
        )}
      </div>
    </div>
  );
}
