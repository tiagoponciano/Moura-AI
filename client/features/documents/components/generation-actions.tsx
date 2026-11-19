import { ExternalLink, FileDown, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDF_ENABLED } from "../lib/pdf-enabled";

type GenerationActionsProps = {
  /** The current PDF; `undefined` before it exists or after a field changes. */
  pdf?: { url: string; fileName: string };
  generating: boolean;
  notice?: string;
  onGenerate: () => void;
  onDownloadDocx: () => void;
};

/** The panel footer: the PDF once it is ready, the button to make it, and the `.docx`. */
export function GenerationActions({
  pdf,
  generating,
  notice,
  onGenerate,
  onDownloadDocx,
}: GenerationActionsProps) {
  return (
    <>
      {!PDF_ENABLED ? null : pdf ? (
        <div className="flex gap-2">
          <Button asChild size="lg" className="flex-1">
            <a href={pdf.url} download={pdf.fileName}>
              <FileDown /> Baixar PDF
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={pdf.url} target="_blank">
              <ExternalLink /> Abrir
            </a>
          </Button>
        </div>
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
