"use client";

import { saveAs } from "file-saver";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
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
import { fetchFillings, saveFilling, type Filling } from "../lib/fillings";
import { generateDocument } from "../lib/generate-document";
import {
  changedProjectData,
  valuesFromProject,
  type ProjectData,
} from "../lib/project-fields";
import type { Project } from "../lib/projects";
import {
  FILL_FIELDS_TOOL,
  loadTemplateGuide,
  loadTemplateIndex,
  loadTemplateSchema,
  type FieldValue,
  type FieldValues,
  type TemplateEntry,
  type TemplateSchema,
} from "../lib/templates";

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
  const [problems, setProblems] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const [attempted, setAttempted] = useState(false);
  /** The project's data when the form was chosen, for filling it once its fields load. */
  const [prefill, setPrefill] = useState<ProjectData>({});
  /** What was saved for each form of the current project. */
  const [fillings, setFillings] = useState<Filling[]>([]);
  const [pdf, setPdf] = useState<{ url: string; fileName: string }>();
  const [notice, setNotice] = useState<string>();
  /** The values as of the last change, for generating right after a merge. */
  const latestValues = useRef<FieldValues>({});
  /** Only the newest PDF request may show its result. */
  const pdfRequest = useRef(0);
  const pendingSave = useRef<ReturnType<typeof setTimeout>>(undefined);

  const template = templates.find((entry) => entry.id === selectedId);
  const projectId = project?.id;
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;
  const steps = useMemo(
    () => (schema ? conversationSteps(schema, guide) : []),
    [schema, guide],
  );

  useEffect(() => {
    setFillings([]);
    if (!projectId) return;
    let cancelled = false;
    fetchFillings(projectId).then(
      (body) => {
        if (!cancelled) setFillings(body.fillings);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [projectId]);

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
    const saved = projectIdRef.current
      ? fetchFillings(projectIdRef.current).then(
          (body) => body.fillings,
          () => [] as Filling[],
        )
      : Promise.resolve([] as Filling[]);
    Promise.all([
      loadTemplateSchema(template),
      loadTemplateGuide(template),
      saved,
    ])
      .then(([loaded, loadedGuide, savedFillings]) => {
        if (cancelled) return;
        setGuide(loadedGuide);
        setFillings(savedFillings);
        const own = savedFillings.find(
          (filling) => filling.template_id === template.id,
        );
        const known = {
          ...valuesFromProject(loaded, prefill),
          ...pickExtractedValues(loaded, own?.values),
        };
        latestValues.current = known;
        setValues(known);
        setSources(
          recordSources(
            recordSources({}, Object.keys(known), "project"),
            Object.keys(pickExtractedValues(loaded, own?.values)),
            "user",
          ),
        );
        setSchema(loaded);
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
  }, [template, prefill]);

  function discardPdf() {
    pdfRequest.current += 1;
    setGenerating(false);
    setPdf((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return undefined;
    });
  }

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

  /** Saves this form's values for the project; a form with nothing filled is not saved. */
  const persistFilling = useCallback(
    (current: FieldValues) => {
      if (!project || !template) return;
      const values = Object.fromEntries(
        Object.entries(current).filter(([, value]) => value !== undefined),
      );
      if (Object.keys(values).length === 0) return;
      const templateId = template.id;
      saveFilling(project.id, templateId, current).then(
        () =>
          setFillings((list) => [
            {
              template_id: templateId,
              values,
              updated_at: new Date().toISOString(),
            },
            ...list.filter((filling) => filling.template_id !== templateId),
          ]),
        (cause) => setNotice(errorMessage(cause)),
      );
    },
    [project, template],
  );

  const generatePdf = useCallback(
    async (templateId: string, values: FieldValues) => {
      pdfRequest.current += 1;
      const request = pdfRequest.current;
      setPdf((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return undefined;
      });
      setGenerating(true);
      setNotice(undefined);
      try {
        const file = await generateDocument(templateId, "pdf", values);
        if (request !== pdfRequest.current) return;
        setPdf({
          url: URL.createObjectURL(file.blob),
          fileName: file.fileName,
        });
      } catch (cause) {
        if (request === pdfRequest.current) setNotice(errorMessage(cause));
      } finally {
        if (request === pdfRequest.current) setGenerating(false);
      }
    },
    [],
  );

  /** Selects a template; no id goes back to the gallery. */
  function selectTemplate(id?: string) {
    discardPdf();
    latestValues.current = {};
    setNotice(undefined);
    clearTimeout(pendingSave.current);
    setPrefill(project?.data ?? {});
    setSelectedId(id);
    setSchema(undefined);
    setGuide(undefined);
    setSkipped([]);
    setValues({});
    setSources({});
    setProblems([]);
    setAttempted(false);
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
      setProblems([]);
      saveToProject(schema, merged);
      persistFilling(merged);
      // The assistant filled the form: once it is complete, the PDF follows by itself.
      const validation = validateForDocument(schema, merged);
      if (validation.ok) void generatePdf(template.id, validation.values);
    },
    [schema, steps, template, generatePdf, saveToProject, persistFilling],
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

  /** The fields ready for a document, or `undefined` after listing what is wrong. */
  function validatedValues() {
    if (!schema) return undefined;
    setAttempted(true);
    const validation = validateForDocument(schema, values);
    if (!validation.ok) {
      setProblems(validation.problems);
      return undefined;
    }
    setProblems([]);
    return validation.values;
  }

  async function generate() {
    const ready = validatedValues();
    if (template && ready) await generatePdf(template.id, ready);
  }

  async function downloadDocx() {
    const ready = validatedValues();
    if (!template || !ready) return;
    try {
      const file = await generateDocument(template.id, "docx", ready);
      saveAs(file.blob, file.fileName);
    } catch (cause) {
      setNotice(errorMessage(cause));
    }
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
