"use client";

import { Eye, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Project } from "@/lib/projects/project";
import { useProposal } from "../hooks/use-proposal";
import { PDF_ENABLED } from "../lib/pdf-enabled";
import { DEFAULT_VALIDITY_DAYS, PROPOSAL_PLANS } from "../lib/proposal";
import { PlanField } from "./plan-field";
import { ProposalPreviewPane } from "./proposal-preview-pane";
import { ProposalSummary } from "./proposal-summary";

type ProposalFormProps = { project: Project };

/** The commercial proposal of a project: the choices and downloads on the left, the PDF preview beside them. */
export function ProposalForm({ project }: ProposalFormProps) {
  const [planId, setPlanId] = useState(PROPOSAL_PLANS[0].id);
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState(String(DEFAULT_VALIDITY_DAYS));
  const reais = Number(price.replace(/\./g, "").replace(",", "."));
  const ready = Number.isFinite(reais) && reais > 0;

  const { busy, error, note, preview, stale, run } = useProposal(project, {
    planId,
    reais,
    validity,
  });
  const idle = busy === undefined;

  return (
    <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <div className="grid gap-3">
          <PlanField value={planId} onChange={setPlanId} />
          <div className="grid grid-cols-2 gap-3">
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
        </div>
        <ProposalSummary project={project} />
        <div className="flex flex-col gap-2">
          {PDF_ENABLED && (
            <Button
              type="button"
              disabled={!ready || !idle}
              onClick={() => run("pdf", "preview")}
            >
              {busy === "pdf" ? <Loader2 className="animate-spin" /> : <Eye />}
              {preview ? "Atualizar prévia" : "Ver prévia"}
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!ready || !idle}
              onClick={() => run("pptx", "download")}
            >
              <FileDown />
              Baixar .pptx
            </Button>
            {PDF_ENABLED && (
              <Button
                type="button"
                variant="outline"
                disabled={!ready || !idle}
                onClick={() => run("pdf", "download")}
              >
                <FileDown />
                Baixar PDF
              </Button>
            )}
          </div>
        </div>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <ProposalPreviewPane
        url={preview?.url}
        stale={stale}
        loading={busy === "pdf"}
        available={PDF_ENABLED}
      />
    </div>
  );
}
