import { FileText, Loader2 } from "lucide-react";

type ProposalPreviewPaneProps = {
  /** Object URL of the PDF previewed, if any. */
  url?: string;
  /** The preview was made from choices that have changed since. */
  stale: boolean;
  loading: boolean;
  /** PDF output is on, so there is a preview to ask for. */
  available: boolean;
};

/** The proposal as it will come out, in PDF, beside the form. */
export function ProposalPreviewPane({
  url,
  stale,
  loading,
  available,
}: ProposalPreviewPaneProps) {
  return (
    <div className="flex min-h-[420px] flex-col gap-2 lg:min-h-[calc(100svh-15rem)]">
      {stale && (
        <p role="status" className="text-xs text-muted-foreground">
          A prévia é de antes das últimas mudanças. Clique em Atualizar prévia.
        </p>
      )}
      <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/40">
        {url ? (
          <iframe src={url} title="Prévia da proposta" className="size-full" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <FileText className="size-6" />
            {available
              ? "Digite o valor e clique em Ver prévia para ver a proposta como ela vai sair."
              : "A prévia precisa da saída em PDF, que está desligada neste ambiente."}
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
