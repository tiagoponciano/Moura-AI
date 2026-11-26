"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProposalPreviewDialogProps = {
  /** Object URL of the PDF being previewed. */
  url: string;
  busy: boolean;
  onDownloadPdf: () => void;
  onDownloadPptx: () => void;
  onClose: () => void;
};

/** The proposal as it will come out, in PDF, with the downloads under it. */
export function ProposalPreviewDialog({
  url,
  busy,
  onDownloadPdf,
  onDownloadPptx,
  onClose,
}: ProposalPreviewDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="flex h-[90vh] flex-col sm:max-w-5xl"
      >
        <DialogHeader>
          <DialogTitle>Prévia da proposta</DialogTitle>
        </DialogHeader>
        <iframe
          src={url}
          title="Prévia da proposta"
          className="min-h-0 w-full flex-1 rounded-md border bg-muted"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Voltar e editar
          </Button>
          <Button variant="outline" disabled={busy} onClick={onDownloadPptx}>
            {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
            Baixar .pptx
          </Button>
          <Button disabled={busy} onClick={onDownloadPdf}>
            {busy ? <Loader2 className="animate-spin" /> : <FileDown />}
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
