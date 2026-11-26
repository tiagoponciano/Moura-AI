"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSaveStatus, type SaveRunner } from "../hooks/use-save-status";
import { resetProposalTemplate, uploadProposalTemplate } from "../lib/client";
import { templateFileProblem, templateSource } from "../lib/proposal-template";
import type { ProposalTemplateInfo } from "../lib/types";
import { FormStatus } from "./form-status";
import { TemplateDropZone } from "./template-drop-zone";

type ProposalTemplatePanelProps = {
  info: ProposalTemplateInfo;
  run: SaveRunner;
};

/** The deck every proposal is filled from: drop a new one (it is in use at once), download the current one, or go back to the app's own. */
export function ProposalTemplatePanel({
  info,
  run,
}: ProposalTemplatePanelProps) {
  const [problem, setProblem] = useState<string>();
  const { saving, status, save } = useSaveStatus(run);

  function send(file: File) {
    const refused = templateFileProblem(file);
    setProblem(refused);
    if (!refused) {
      void save(() => uploadProposalTemplate(file), "Modelo salvo e em uso.");
    }
  }

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Modelo da proposta</CardTitle>
        <CardDescription>
          A apresentação .pptx de onde sai cada proposta. {templateSource(info)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <TemplateDropZone busy={saving} onSelect={send} />
        {problem && (
          <p role="alert" className="text-xs text-destructive">
            {problem}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/documents/proposal-template/file">
              <Download />
              Baixar o modelo em uso
            </a>
          </Button>
          {info.custom && (
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() =>
                void save(resetProposalTemplate, "Voltou ao modelo do app.")
              }
            >
              Voltar ao modelo do app
            </Button>
          )}
          <FormStatus state={status} />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Etiquetas do modelo</p>
          <p className="text-xs text-muted-foreground">
            O app preenche estas etiquetas, escritas entre chaves duplas no
            texto da apresentação. Use as que quiser: o que o modelo não tem
            fica como está escrito nele. Só{" "}
            <span className="font-mono">{"{{client}}"}</span> e{" "}
            <span className="font-mono">{"{{price}}"}</span> são obrigatórias, e
            uma etiqueta fora desta lista faz o modelo ser recusado.
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {info.tags.map((tag) => (
              <li
                key={tag}
                className="rounded border px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {`{{${tag}}}`}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
