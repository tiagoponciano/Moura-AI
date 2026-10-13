"use client";

import { Loader2 } from "lucide-react";
import { Chat } from "@/components/chat/chat";
import { useDocumentFilling } from "../hooks/use-document-filling";
import { FormPanel } from "./form-panel";
import { TemplatePicker } from "./template-picker";
import { TemplateSelect } from "./template-select";

/** Template choice, assistant chat and form panel for the documents module. */
export function DocumentWorkspace() {
  const filling = useDocumentFilling();
  const { template, schema } = filling;

  return (
    <>
      {filling.loadError && (
        <p className="text-sm text-destructive">{filling.loadError}</p>
      )}

      {!template ? (
        <TemplatePicker
          templates={filling.templates}
          onSelect={filling.selectTemplate}
        />
      ) : !schema || !filling.progress ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Carregando campos…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <TemplateSelect
            templates={filling.templates}
            value={template.id}
            onChange={filling.selectTemplate}
          />
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-h-[420px] lg:min-h-0">
              <Chat
                key={template.id}
                endpoint="/api/documents/chat"
                body={filling.chatBody}
                onToolResult={filling.handleToolResult}
                history={{
                  module: "documents",
                  context: { templateId: template.id },
                }}
                placeholder="Ex.: imóvel da Padaria Silva, Rua X 123, 750 m², comercial, 2 pavimentos"
                emptyState="Descreva o imóvel e o proprietário. A Moura AI preenche os campos ao lado."
              />
            </div>
            <FormPanel
              fields={schema.fields}
              values={filling.values}
              progress={filling.progress}
              problems={filling.problems}
              showMissing={filling.attempted}
              generating={filling.generating}
              onChange={filling.updateField}
              onGenerate={filling.generate}
            />
          </div>
        </div>
      )}
    </>
  );
}
