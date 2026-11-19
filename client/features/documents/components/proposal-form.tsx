"use client";

import { saveAs } from "file-saver";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/api/request-json";
import {
  DEFAULT_VALIDITY_DAYS,
  PROPOSAL_PLANS,
  type ProposalRequest,
} from "../lib/proposal";
import { type Project } from "@/lib/projects/project";
import { nameWithProject } from "@/lib/projects/file-name";
import { keepProjectFile } from "@/lib/projects/files-client";
import { PDF_ENABLED } from "../lib/pdf-enabled";
import { PlanField } from "./plan-field";

type ProposalFormProps = { project: Project };

/** The commercial proposal of a project: pick the plan and the price, download the deck, and its PDF when PDF output is on. */
export function ProposalForm({ project }: ProposalFormProps) {
  const [planId, setPlanId] = useState(PROPOSAL_PLANS[0].id);
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState(String(DEFAULT_VALIDITY_DAYS));
  const [busy, setBusy] = useState<ProposalRequest["format"]>();
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();

  const reais = Number(price.replace(/\./g, "").replace(",", "."));
  const ready = Number.isFinite(reais) && reais > 0;

  async function download(format: ProposalRequest["format"]) {
    setBusy(format);
    setError(undefined);
    setNote(undefined);
    try {
      const response = await fetch(
        `/api/documents/projects/${project.id}/proposal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            price: reais,
            validityDays: Number(validity) || DEFAULT_VALIDITY_DAYS,
            format,
          }),
        },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => undefined);
        throw new Error(body?.error ?? "Não foi possível gerar a proposta.");
      }
      const blob = await response.blob();
      const fileName = nameWithProject(`Proposta.${format}`, project.name);
      saveAs(blob, fileName);
      const kept = await keepProjectFile(project.id, blob, {
        kind: "proposal",
        fileName,
      });
      if (!kept) setNote("Baixada, mas não foi guardada no projeto.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

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
        {(PDF_ENABLED ? (["pptx", "pdf"] as const) : (["pptx"] as const)).map(
          (format) => (
            <Button
              key={format}
              type="button"
              variant={format === "pptx" ? "default" : "outline"}
              disabled={!ready || busy !== undefined}
              onClick={() => download(format)}
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
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
