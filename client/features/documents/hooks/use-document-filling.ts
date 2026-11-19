"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { recordSources, type FieldSources } from "@/lib/field-sources";
import {
  type ConversationGuide,
  conversationSteps,
  SKIP_STEP_FIELD,
  stepProgress,
} from "../lib/conversation-steps";
import {
  pickExtractedValues,
  requiredProgress,
  validateForDocument,
} from "../lib/form-values";
import { changedProjectData } from "../lib/project-fields";
import {
  FILL_FIELDS_TOOL,
  loadTemplateIndex,
  type FieldValue,
  type FieldValues,
  type TemplateEntry,
  type TemplateSchema,
} from "../lib/templates";
import { type Project, type ProjectData } from "@/lib/projects/project";
import { PDF_ENABLED } from "../lib/pdf-enabled";
import { keepProjectFile } from "@/lib/projects/files-client";
import { useFormExport } from "./use-form-export";
import { loadFormData } from "../lib/load-form-data";
import { usePdfPreview } from "./use-pdf-preview";
import { useSavedFillings } from "./use-saved-fillings";

/** State and actions of the documents workspace: template, form values and the generated document. */
export function useDocumentFilling(
  project: Project | undefined,
  saveProjectData: (id: string, data: ProjectData) => void,
) {
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [schema, setSchema] = useState<TemplateSchema>();
  const [guide, setGuide] = useState<ConversationGuide>();
  /** Steps the user said do not apply, by position. */
  const [skipped, setSkipped] = useState<number[]>([]);
  const [values, setValues] = useState<FieldValues>({});
  const [sources, setSources] = useState<FieldSources>({});
  const [loadError, setLoadError] = useState<string>();
  /** The project's data when the form was chosen, for filling it once its fields load. */
  const [prefill, setPrefill] = useState<ProjectData>({});
  /** The project the open form's saved values are loaded for, fixed when the form is chosen. */
  const [loadProjectId, setLoadProjectId] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const {
    pdf,
    generating,
    generate: generatePdf,
    discard: discardPdf,
  } = usePdfPreview(setNotice);
  /** The values as of the last change, for generating right after a merge. */
  const latestValues = useRef<FieldValues>({});
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const template = templates.find((entry) => entry.id === selectedId);
  const {
    fillings,
    replace: replaceFillings,
    persist: persistFilling,
  } = useSavedFillings(project, template, setNotice);
  const {
    problems,
    attempted,
    clearProblems,
    reset: resetExport,
    generate,
    downloadDocx,
  } = useFormExport({
    schema,
    values,
    template,
    generatePdf,
    setNotice,
    onGenerated: async (file) => {
      if (!project) return;
      const kept = await keepProjectFile(project.id, file.blob, {
        kind: "form",
        fileName: file.fileName,
      });
      if (!kept) {
        setNotice("O documento foi baixado, mas não foi guardado no projeto.");
      }
    },
  });

  const steps = useMemo(
    () => (schema ? conversationSteps(schema, guide) : []),
    [schema, guide],
  );

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
    loadFormData(template, loadProjectId, prefill)
      .then((form) => {
        if (cancelled) return;
        setGuide(form.guide);
        replaceFillings(loadProjectId, form.fillings);
        latestValues.current = form.values;
        setValues(form.values);
        setSources(form.sources);
        setSchema(form.schema);
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
  }, [template, prefill, loadProjectId, replaceFillings]);

  /** Sends what this form changed in the shared data; a project is optional. */
  const saveToProject = useCallback(
    (loaded: TemplateSchema, current: FieldValues) => {
      if (!project) return;
      const changed = changedProjectData(loaded, current, project.data);
      if (Object.keys(changed).length > 0) {
        saveProjectData(project.id, changed);
      }
    },
    [project, saveProjectData],
  );

  /** Selects a template; no id goes back to the gallery. */
  function selectTemplate(id?: string) {
    discardPdf();
    latestValues.current = {};
    setNotice(undefined);
    clearTimeout(pendingSave.current);
    setPrefill(project?.data ?? {});
    setLoadProjectId(project?.id);
    setSelectedId(id);
    setSchema(undefined);
    setGuide(undefined);
    setSkipped([]);
    setValues({});
    setSources({});
    resetExport();
    setLoadError(undefined);
  }

  const handleToolResult = useCallback(
    (toolName: string, output: unknown) => {
      if (toolName !== FILL_FIELDS_TOOL || !schema || !template) return;
      if (
        (output as Record<string, unknown> | null)?.[SKIP_STEP_FIELD] === true
      ) {
        // Skips the step the agent was asking about, before this output's values.
        setSkipped((current) => {
          const { index } = stepProgress(
            schema,
            steps,
            latestValues.current,
            current,
          );
          return current.includes(index) ? current : [...current, index];
        });
      }
      const extracted = pickExtractedValues(schema, output);
      if (Object.keys(extracted).length === 0) return;
      const merged = { ...latestValues.current, ...extracted };
      latestValues.current = merged;
      setValues(merged);
      setSources((current) =>
        recordSources(current, Object.keys(extracted), "assistant"),
      );
      clearProblems();
      saveToProject(schema, merged);
      persistFilling(merged);
      // The assistant filled the form: once it is complete, the PDF follows by itself.
      const validation = validateForDocument(schema, merged);
      if (PDF_ENABLED && validation.ok) {
        void generatePdf(template.id, validation.values);
      }
    },
    [
      schema,
      steps,
      template,
      generatePdf,
      clearProblems,
      saveToProject,
      persistFilling,
    ],
  );

  function updateField(name: string, value: FieldValue | undefined) {
    latestValues.current = { ...latestValues.current, [name]: value };
    setValues(latestValues.current);
    discardPdf();
    // Typing saves once, after a pause.
    clearTimeout(pendingSave.current);
    pendingSave.current = setTimeout(() => {
      if (schema) saveToProject(schema, latestValues.current);
      persistFilling(latestValues.current);
    }, 800);
    setSources((current) => recordSources(current, [name], "user"));
  }

  const chatBody = useMemo(
    () => ({ templateId: selectedId, schema, values, skipped }),
    [selectedId, schema, values, skipped],
  );

  return {
    templates,
    fillings,
    template,
    schema,
    values,
    sources,
    problems,
    loadError,
    generating,
    attempted,
    progress: schema ? requiredProgress(schema, values) : undefined,
    step: schema ? stepProgress(schema, steps, values, skipped) : undefined,
    chatBody,
    selectTemplate,
    handleToolResult,
    updateField,
    pdf,
    notice,
    generate,
    downloadDocx,
  };
}
