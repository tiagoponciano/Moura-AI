"use client";

import { Eye, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_VALIDITY_DAYS, PROPOSAL_PLANS } from "../lib/proposal";
import { type Project } from "@/lib/projects/project";
import { PDF_ENABLED } from "../lib/pdf-enabled";
import { useProposal } from "../hooks/use-proposal";
import { PlanField } from "./plan-field";
import { ProposalPreviewDialog } from "./proposal-preview-dialog";

type ProposalFormProps = { project: Project };

/** The commercial proposal of a project: pick the plan and the price, download the deck, and its PDF when PDF output is on. */
export function ProposalForm({ project }: ProposalFormProps) {
  const [planId, setPlanId] = useState(PROPOSAL_PLANS[0].id);
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState(String(DEFAULT_VALIDITY_DAYS));
  const reais = Number(price.replace(/\./g, "").replace(",", "."));
  const ready = Number.isFinite(reais) && reais > 0;

  const { busy, error, note, preview, run, closePreview } = useProposal(
    project,
    { planId, reais, validity },
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div className="grid gap-3 sm:grid-cols-3">
        <PlanField value={planId} onChange={setPlanId} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="proposal-price" className="text-xs">
            Valor (R$)
          </Label>
          <Input
            id="proposal-price"
            inputMode="decimal"
            placeholder="4.500,00"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="proposal-validity" className="text-xs">
            Validade (dias)
          </Label>
          <Input
            id="proposal-validity"
            inputMode="numeric"
            value={validity}
            onChange={(event) => setValidity(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {PDF_ENABLED && (
          <Button
            type="button"
            variant="outline"
            disabled={!ready || busy !== undefined}
            onClick={() => run("pdf", "preview")}
          >
            {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Eye />}
            Ver prévia
          </Button>
        )}
        {(PDF_ENABLED ? (["pptx", "pdf"] as const) : (["pptx"] as const)).map(
          (format) => (
            <Button
              key={format}
              type="button"
              variant={format === "pptx" ? "default" : "outline"}
              disabled={!ready || busy !== undefined}
              onClick={() => run(format, "download")}
            >
              {busy === format ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileDown />
              )}
              {format === "pptx" ? "Baixar .pptx" : "Baixar PDF"}
            </Button>
          ),
        )}
      </div>
      {preview && (
        <ProposalPreviewDialog
          url={preview.url}
          busy={busy !== undefined}
          onDownloadPdf={() => run("pdf", "download")}
          onDownloadPptx={() => run("pptx", "download")}
          onClose={closePreview}
        />
      )}
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
