"use client";

import { saveAs } from "file-saver";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorMessage } from "@/lib/api/request-json";
import {
  DEFAULT_VALIDITY_DAYS,
  PROPOSAL_PLANS,
  type ProposalRequest,
} from "../lib/proposal";
import type { Project } from "../lib/projects";

type ProposalFormProps = { project: Project };

/** The commercial proposal of a project: pick the plan and the price, download the deck or its PDF. */
export function ProposalForm({ project }: ProposalFormProps) {
  const [planId, setPlanId] = useState(PROPOSAL_PLANS[0].id);
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState(String(DEFAULT_VALIDITY_DAYS));
  const [busy, setBusy] = useState<ProposalRequest["format"]>();
  const [error, setError] = useState<string>();

  const reais = Number(price.replace(/\./g, "").replace(",", "."));
  const ready = Number.isFinite(reais) && reais > 0;

  async function download(format: ProposalRequest["format"]) {
    setBusy(format);
    setError(undefined);
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
      saveAs(await response.blob(), `proposta.${format}`);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground">
        O cliente, o empreendimento e o município vêm dos dados do projeto.
        Escolha o plano e informe o valor.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Plano</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger aria-label="Plano">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_PLANS.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        {(["pptx", "pdf"] as const).map((format) => (
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
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
