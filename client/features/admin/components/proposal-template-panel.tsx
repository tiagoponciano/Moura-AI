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
import { Badge } from "@/components/ui/badge";
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
          A apresentação .pptx de onde sai cada proposta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
          <Badge variant={info.custom ? "default" : "secondary"}>Em uso</Badge>
          <span>{templateSource(info)}</span>
        </div>
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
                void save(
                  resetProposalTemplate,
                  "Voltou ao modelo padrão do app.",
                )
              }
            >
              Usar o modelo padrão do app
            </Button>
          )}
          <FormStatus state={status} />
        </div>
        <TagList
          title="Etiquetas que este modelo preenche"
          tags={info.inUse.used}
          empty="Nenhuma."
        />
        <TagList
          title="Etiquetas que ele não usa"
          note="O app tem valor para elas, mas neste modelo essa parte fica como está escrita. Só {{client}} e {{price}} são obrigatórias; uma etiqueta fora das listas faz o modelo ser recusado."
          tags={info.inUse.unused}
          empty="Todas são usadas."
          muted
        />
      </CardContent>
    </Card>
  );
}

function TagList({
  title,
  note,
  tags,
  empty,
  muted = false,
}: {
  title: string;
  note?: string;
  tags: string[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{title}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className={`rounded border px-1.5 py-0.5 font-mono text-xs ${muted ? "text-muted-foreground" : ""}`}
            >
              {`{{${tag}}}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
