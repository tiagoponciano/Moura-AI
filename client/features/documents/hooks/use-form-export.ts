"use client";

import { saveAs } from "file-saver";
import { useCallback, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { validateForDocument } from "../lib/form-values";
import { generateDocument } from "../lib/generate-document";
import type {
  FieldValues,
  TemplateEntry,
  TemplateSchema,
} from "../lib/templates";

type FormExportInput = {
  schema: TemplateSchema | undefined;
  values: FieldValues;
  template: TemplateEntry | undefined;
  generatePdf: (templateId: string, values: FieldValues) => Promise<void>;
  setNotice: (message: string | undefined) => void;
  /** The name the `.docx` is downloaded and kept under; the server's by default. */
  nameFile?: (fileName: string) => string;
  /** Called with the `.docx` after it is downloaded, to keep it in the project. */
  onGenerated?: (file: { blob: Blob; fileName: string }) => Promise<void>;
};

/** Validates the form before a document is made, and keeps what is wrong; makes the PDF or the .docx. */
export function useFormExport({
  schema,
  values,
  template,
  generatePdf,
  setNotice,
  nameFile,
  onGenerated,
}: FormExportInput) {
  const [problems, setProblems] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);

  const clearProblems = useCallback(() => setProblems([]), []);
  const reset = useCallback(() => {
    setProblems([]);
    setAttempted(false);
  }, []);

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
      const named = {
        blob: file.blob,
        fileName: nameFile ? nameFile(file.fileName) : file.fileName,
      };
      saveAs(named.blob, named.fileName);
      await onGenerated?.(named);
    } catch (cause) {
      setNotice(errorMessage(cause));
    }
  }

  return { problems, attempted, clearProblems, reset, generate, downloadDocx };
}
