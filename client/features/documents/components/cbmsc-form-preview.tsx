"use client";

import { ArrowLeft, Download, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formLabel } from "@/lib/cbmsc-forms/catalog";
import { googleDocUrls } from "@/lib/cbmsc-forms/links";
import type { CbmscForm } from "@/lib/cbmsc-forms/types";
import { useFormAssistant } from "../hooks/use-form-assistant";
import type { AssistantState } from "../lib/cbmsc-forms";
import type { TemplateEntry } from "../lib/templates";
import { AssistantButton } from "./assistant-button";

type CbmscFormPreviewProps = {
  form: CbmscForm;
  template?: TemplateEntry;
  onFill: (templateId: string) => void;
  onBack: () => void;
};

const ASSISTANT_NOTES: Partial<Record<AssistantState, string>> = {
  outdated:
    "O CBMSC alterou este formulário. O assistente volta quando o modelo for revisado.",
  unverified:
    "Não foi possível confirmar a versão no Google. Confira o documento gerado com o formulário oficial.",
};

/** Google's live preview of the form, with fill, download and open actions. */
export function CbmscFormPreview({
  form,
  template,
  onFill,
  onBack,
}: CbmscFormPreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const urls = googleDocUrls(form.googleDocId);
  const assistant = useFormAssistant(form, template);
  const note =
    ASSISTANT_NOTES[assistant] ??
    (template?.cbmsc?.reviewed === false
      ? "Os campos deste formulário foram identificados automaticamente. Confira o documento gerado."
      : undefined);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="lg:hidden"
        >
          <ArrowLeft /> Voltar à lista
        </Button>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-xs text-muted-foreground">
            {formLabel(form)}
          </span>
          <span className="text-sm font-medium">{form.name}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <AssistantButton
            state={assistant}
            onClick={() => template && onFill(template.id)}
          />
          <Button asChild size="sm" variant="outline">
            <a href={urls.export}>
              <Download /> Baixar .docx atualizado
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={urls.edit} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Abrir no Google Docs
            </a>
          </Button>
        </div>
      </div>
      {note && (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      )}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Carregando a versão atual…
          </div>
        )}
        <iframe
          src={urls.preview}
          title={`Prévia: ${form.name}`}
          onLoad={() => setLoaded(true)}
          className="size-full"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        A prévia e o download vêm direto do Google Docs do CBMSC, na versão
        publicada agora.
      </p>
    </div>
  );
}
