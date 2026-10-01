"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Chat } from "@/components/chat";
import { FieldsPanel, isEmptyValue } from "@/components/fields-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renderDocx } from "@/lib/render-docx";
import { schemaToZod } from "@/lib/schema-to-zod";
import {
  loadTemplateIndex,
  loadTemplateSchema,
  type FieldValue,
  type FieldValues,
  type TemplateEntry,
  type TemplateSchema,
} from "@/lib/templates";

const FILL_TOOL = "preencher_campos";

export default function DocumentosPage() {
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [schema, setSchema] = useState<TemplateSchema>();
  const [values, setValues] = useState<FieldValues>({});
  const [problems, setProblems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [generating, setGenerating] = useState(false);

  const template = templates.find((entry) => entry.id === selectedId);

  useEffect(() => {
    loadTemplateIndex()
      .then(setTemplates)
      .catch(() => setLoadError("Não foi possível carregar a lista de modelos."));
  }, []);

  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    loadTemplateSchema(template)
      .then((loaded) => {
        if (!cancelled) setSchema(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError(`Não foi possível carregar os campos de "${template.nome}".`);
      });
    return () => {
      cancelled = true;
    };
  }, [template]);

  function selectTemplate(id: string) {
    setSelectedId(id);
    setSchema(undefined);
    setValues({});
    setProblems([]);
    setLoadError(undefined);
  }

  const handleToolResult = useCallback(
    (toolName: string, output: unknown) => {
      if (toolName !== FILL_TOOL || !schema || !output || typeof output !== "object") return;
      const known = new Set(schema.campos.map((field) => field.nome));
      const extracted = Object.entries(output as Record<string, unknown>).filter(
        ([name, value]) =>
          known.has(name) &&
          (typeof value === "string" || typeof value === "number" || typeof value === "boolean") &&
          !isEmptyValue(value),
      ) as [string, FieldValue][];
      if (extracted.length === 0) return;
      setValues((current) => ({ ...current, ...Object.fromEntries(extracted) }));
      setProblems([]);
    },
    [schema],
  );

  const chatBody = useMemo(() => ({ templateId: selectedId, schema }), [selectedId, schema]);

  function updateField(name: string, value: FieldValue | undefined) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function generate() {
    if (!template || !schema) return;
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, value]) => !isEmptyValue(value)),
    );
    const result = schemaToZod(schema, "document").safeParse(cleaned);
    if (!result.success) {
      const labels = new Map(schema.campos.map((field) => [field.nome, field.descricao]));
      const messages = result.error.issues.map((issue) => {
        const name = String(issue.path[0]);
        const label = labels.get(name) ?? name;
        return cleaned[name] === undefined ? `${label}: obrigatório` : `${label}: ${issue.message}`;
      });
      setProblems([...new Set(messages)]);
      return;
    }

    setProblems([]);
    setGenerating(true);
    try {
      await renderDocx(template, cleaned);
    } catch (error) {
      console.error("Failed to render document", error);
      setProblems(["Falha ao gerar o documento. Verifique se as tags do modelo estão corretas."]);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Escolha um modelo, converse com o assistente e gere o documento com o layout original.
          </p>
        </div>
        <Select value={selectedId} onValueChange={selectTemplate}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {!template ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          Selecione um modelo para começar.
        </div>
      ) : !schema ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Carregando campos…
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-h-[420px] lg:min-h-0">
            <Chat
              key={template.id}
              endpoint="/api/chat"
              body={chatBody}
              onToolResult={handleToolResult}
              placeholder="Ex.: imóvel da Padaria Silva, Rua X 123, 750 m², comercial, 2 pavimentos"
              emptyState="Descreva o imóvel e o proprietário. O assistente preenche os campos ao lado."
            />
          </div>

          <aside className="flex min-h-0 flex-col rounded-xl border bg-card">
            <div className="border-b px-4 py-2 text-sm font-medium">Campos do formulário</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <FieldsPanel fields={schema.campos} values={values} onChange={updateField} />
            </div>
            <div className="flex flex-col gap-2 border-t p-4">
              {problems.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <p className="font-medium">Corrija antes de gerar:</p>
                  <ul className="mt-1 list-disc pl-4">
                    {problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="animate-spin" /> : <FileDown />}
                Gerar documento
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
