import { FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldSources } from "@/lib/field-sources";
import type { PdfApproval } from "../hooks/use-pdf-approval";
import { PDF_ENABLED } from "../lib/pdf-enabled";
import type { FieldValues, TemplateField } from "../lib/templates";
import { PreviewDialog } from "./preview-dialog";

type GenerationActionsProps = {
  /** The current PDF; `undefined` before it exists or after a field changes. */
  pdf?: { url: string; fileName: string };
  fields: TemplateField[];
  values: FieldValues;
  sources: FieldSources;
  approval: PdfApproval;
  generating: boolean;
  notice?: string;
  onGenerate: () => void;
  onDownloadDocx: () => void;
};

/** The panel footer: the PDF once it is ready, the button to make it, and the `.docx`. */
export function GenerationActions({
  pdf,
  fields,
  values,
  sources,
  approval,
  generating,
  notice,
  onGenerate,
  onDownloadDocx,
}: GenerationActionsProps) {
  return (
    <>
      {!PDF_ENABLED ? null : pdf ? (
        <PreviewDialog
          pdf={pdf}
          fields={fields}
          values={values}
          sources={sources}
          approval={approval}
        />
      ) : (
        <Button onClick={onGenerate} disabled={generating} size="lg">
          {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
          {generating ? "Gerando o PDF…" : "Gerar PDF"}
        </Button>
      )}
      <Button
        variant={PDF_ENABLED ? "ghost" : "default"}
        size={PDF_ENABLED ? "sm" : "lg"}
        disabled={generating}
        onClick={onDownloadDocx}
      >
        <FileText /> Baixar .docx
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {notice ??
          (PDF_ENABLED
            ? "O PDF sai sozinho quando os obrigatórios estão completos, com o layout oficial."
            : "O documento sai com o layout oficial quando os obrigatórios estão completos.")}
      </p>
    </>
  );
}
