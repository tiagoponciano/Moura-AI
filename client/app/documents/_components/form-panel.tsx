"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  FieldValue,
  FieldValues,
  TemplateField,
} from "@/features/documents/lib/templates";
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

/** Side panel: required-field progress, editable fields and the generate button. */
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
  const percent = progress.total
    ? (progress.filled / progress.total) * 100
    : 100;

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Campos do formulário</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.filled}/{progress.total} obrigatórios
          </span>
        </div>
        <Progress
          value={percent}
          aria-label="Campos obrigatórios preenchidos"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <FieldList
          fields={fields}
          values={values}
          onChange={onChange}
          showMissing={showMissing}
        />
      </div>
      <div className="flex flex-col gap-2 border-t p-4">
        <GenerationProblems problems={problems} />
        <Button onClick={onGenerate} disabled={generating} size="lg">
          {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
          Gerar documento
        </Button>
      </div>
    </aside>
  );
}
