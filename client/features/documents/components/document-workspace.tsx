"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  WorkspaceTabs,
  type WorkspaceTab,
} from "@/components/shared/workspace-tabs";
import { cn } from "@/lib/utils";
import { useDocumentFilling } from "../hooks/use-document-filling";
import { FormPanel } from "./form-panel";
import { TemplatePicker } from "./template-picker";
import { TemplateSelect } from "./template-select";

/** Template choice, assistant chat and form panel for the documents module. */
export function DocumentWorkspace() {
  const filling = useDocumentFilling();
  const { template, schema, progress } = filling;
  const [tab, setTab] = useState<WorkspaceTab>("chat");

  return (
    <>
      {filling.loadError && (
        <p className="px-4 pt-4 text-sm text-destructive md:px-6">
          {filling.loadError}
        </p>
      )}

      {!template ? (
        <TemplatePicker
          templates={filling.templates}
          onSelect={filling.selectTemplate}
        />
      ) : !schema || !progress ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Carregando campos…
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
          <WorkspaceTabs
            value={tab}
            onChange={setTab}
            panelLabel={`Campos ${progress.filled}/${progress.total}`}
            className="lg:hidden"
          />
          <div
            className={cn(
              "min-h-0 flex-1",
              tab !== "chat" && "hidden lg:block",
            )}
          >
            <Chat
              key={template.id}
              endpoint="/api/documents/chat"
              body={filling.chatBody}
              onToolResult={filling.handleToolResult}
              history={{
                module: "documents",
                context: { templateId: template.id },
              }}
              title={
                <TemplateSelect
                  templates={filling.templates}
                  value={template.id}
                  onChange={filling.selectTemplate}
                />
              }
              placeholder="Ex.: imóvel da Padaria Silva, Rua X 123, 750 m², comercial, 2 pavimentos"
              emptyState="Descreva o imóvel e o proprietário. A Moura AI preenche os campos ao lado."
              className="rounded-none border-0 bg-transparent"
            />
          </div>
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              tab !== "panel" && "hidden lg:flex",
            )}
          >
            <FormPanel
              fields={schema.fields}
              values={filling.values}
              sources={filling.sources}
              progress={progress}
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
