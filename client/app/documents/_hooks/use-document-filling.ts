"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  pickExtractedValues,
  requiredProgress,
  validateForDocument,
} from "@/lib/documents/form-values";
import { renderDocx } from "@/lib/documents/render-docx";
import {
  FILL_FIELDS_TOOL,
  loadTemplateIndex,
  loadTemplateSchema,
  type FieldValue,
  type FieldValues,
  type TemplateEntry,
  type TemplateSchema,
} from "@/lib/documents/templates";

/** State and actions of the documents workspace: template, form values and generation. */
export function useDocumentFilling() {
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [schema, setSchema] = useState<TemplateSchema>();
  const [values, setValues] = useState<FieldValues>({});
  const [problems, setProblems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const template = templates.find((entry) => entry.id === selectedId);

  useEffect(() => {
    loadTemplateIndex()
      .then(setTemplates)
      .catch(() =>
        setLoadError("Não foi possível carregar a lista de modelos."),
      );
  }, []);

  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    loadTemplateSchema(template)
      .then((loaded) => {
        if (!cancelled) setSchema(loaded);
      })
      .catch(() => {
        if (!cancelled)
          setLoadError(
            `Não foi possível carregar os campos de "${template.name}".`,
          );
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
    setAttempted(false);
    setLoadError(undefined);
  }

  const handleToolResult = useCallback(
    (toolName: string, output: unknown) => {
      if (toolName !== FILL_FIELDS_TOOL || !schema) return;
      const extracted = pickExtractedValues(schema, output);
      if (Object.keys(extracted).length === 0) return;
      setValues((current) => ({ ...current, ...extracted }));
      setProblems([]);
    },
    [schema],
  );

  function updateField(name: string, value: FieldValue | undefined) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function generate() {
    if (!template || !schema) return;
    setAttempted(true);
    const validation = validateForDocument(schema, values);
    if (!validation.ok) {
      setProblems(validation.problems);
      return;
    }

    setProblems([]);
    setGenerating(true);
    try {
      await renderDocx(template, validation.values);
    } catch (error) {
      console.error("Failed to render document", error);
      setProblems([
        "Falha ao gerar o documento. Verifique se as tags do modelo estão corretas.",
      ]);
    } finally {
      setGenerating(false);
    }
  }

  const chatBody = useMemo(
    () => ({ templateId: selectedId, schema }),
    [selectedId, schema],
  );

  return {
    templates,
    template,
    schema,
    values,
    problems,
    loadError,
    generating,
    attempted,
    progress: schema ? requiredProgress(schema, values) : undefined,
    chatBody,
    selectTemplate,
    handleToolResult,
    updateField,
    generate,
  };
}
