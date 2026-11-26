"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { SourceTagBadge } from "@/components/shared/source-tag-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FieldSources } from "@/lib/field-sources";
import type { PdfApproval } from "../hooks/use-pdf-approval";
import { NormsToCheck, type NormsToCheckProps } from "./norms-to-check";
import { reviewSummary } from "../lib/review-summary";
import type { FieldValues, TemplateField } from "../lib/templates";

type PreviewDialogProps = {
  pdf: { url: string; fileName: string };
  fields: TemplateField[];
  values: FieldValues;
  sources: FieldSources;
  approval: PdfApproval;
  norms: NormsToCheckProps;
};

/** The document as it will come out, with what it carries and what is missing, to approve before it is downloaded and kept. */
export function PreviewDialog({
  pdf,
  fields,
  values,
  sources,
  approval,
  norms,
}: PreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const { filled, missingRequired } = reviewSummary(fields, values, sources);

  async function approve() {
    if (await approval.approve(pdf)) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Ver prévia e aprovar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Prévia do documento</DialogTitle>
          <DialogDescription>
            É este arquivo que será baixado e guardado no projeto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <iframe
            src={pdf.url}
            title="Prévia do documento"
            className="h-[68vh] w-full rounded-md border bg-muted"
          />
          <div className="flex max-h-[68vh] flex-col gap-3 overflow-y-auto pr-1 text-sm">
            {missingRequired.length > 0 && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 p-3"
              >
                <p className="font-medium text-destructive">
                  Faltam {missingRequired.length} campos obrigatórios
                </p>
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {missingRequired.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            )}
            <NormsToCheck
              norms={norms.norms}
              onConfirm={norms.onConfirm}
              onReject={(key) => {
                norms.onReject(key);
                setOpen(false);
              }}
            />
            <div>
              <p className="mb-1 font-medium">O documento leva</p>
              <ul className="divide-y rounded-md border">
                {filled.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-start justify-between gap-3 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="block break-words">{item.text}</span>
                    </span>
                    {item.tag && <SourceTagBadge tag={item.tag} />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {approval.error && (
          <p role="alert" className="text-sm text-destructive">
            {approval.error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Voltar e editar
          </Button>
          <Button
            type="button"
            onClick={() => void approve()}
            disabled={approval.busy || missingRequired.length > 0}
          >
            {approval.busy ? (
              <Loader2 className="animate-spin" />
            ) : (
              <FileDown />
            )}
            Aprovar e baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
