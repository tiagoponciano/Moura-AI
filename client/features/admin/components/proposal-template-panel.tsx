"use client";

import { Download, Upload } from "lucide-react";
import { useRef } from "react";
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
import { templateSource } from "../lib/proposal-template";
import type { ProposalTemplateInfo } from "../lib/types";
import { FormStatus } from "./form-status";

type ProposalTemplatePanelProps = {
  info: ProposalTemplateInfo;
  run: SaveRunner;
};

/** The deck every proposal is filled from: download it, send a new one, or go back to the app's own. */
export function ProposalTemplatePanel({
  info,
  run,
}: ProposalTemplatePanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const { saving, status, save } = useSaveStatus(run);

  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Modelo da proposta</CardTitle>
        <CardDescription>
          A apresentação .pptx de onde sai cada proposta. {templateSource(info)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/api/documents/proposal-template/file">
              <Download />
              Baixar o modelo em uso
            </a>
          </Button>
          <Button disabled={saving} onClick={() => input.current?.click()}>
            <Upload />
            Enviar novo modelo
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
          <input
            ref={input}
            type="file"
            accept=".pptx"
            hidden
            aria-label="Modelo da proposta (.pptx)"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void save(() => uploadProposalTemplate(file), "Modelo salvo.");
              }
            }}
          />
          <FormStatus state={status} />
        </div>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Etiquetas do modelo</p>
          <p className="text-xs text-muted-foreground">
            O app preenche estas etiquetas, escritas entre chaves duplas no
            texto da apresentação. O modelo enviado precisa ter todas elas e
            nenhuma outra; senão é recusado.
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
