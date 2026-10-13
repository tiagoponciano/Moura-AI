"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FieldValue, FieldValues, TemplateField } from "../lib/templates";
import { FieldList } from "./field-list";
import { GenerationProblems } from "./generation-problems";

type FormPanelProps = {
  fields: TemplateField[];
  values: FieldValues;
  progress: { filled: number; total: number };
  problems: string[];
  showMissing: boolean;
  generating: boolean;
  onChange: (name: string, value: FieldValue | undefined) => void;
  onGenerate: () => void;
};

/** Side panel: per-field progress, editable fields and the generate button. */
export function FormPanel({
  fields,
  values,
  progress,
  problems,
  showMissing,
  generating,
  onChange,
  onGenerate,
}: FormPanelProps) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-card lg:border-l">
      <div className="flex flex-col gap-2.5 px-5 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <h2 className="font-semibold">Campos do documento</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.filled} de {progress.total} obrigatórios
          </span>
        </div>
        {progress.total > 0 && (
          <div
            role="progressbar"
            aria-label="Campos obrigatórios preenchidos"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.filled}
            className="flex gap-1"
          >
            {Array.from({ length: progress.total }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full bg-muted transition-colors",
                  index < progress.filled && "bg-success",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <FieldList
          fields={fields}
          values={values}
          onChange={onChange}
          showMissing={showMissing}
        />
      </div>
      <div className="flex flex-col gap-2 border-t px-5 py-4">
        <GenerationProblems problems={problems} />
        <Button onClick={onGenerate} disabled={generating} size="lg">
          {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
          Gerar documento
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Baixa o .docx com o layout original do modelo.
        </p>
      </div>
    </aside>
  );
}
