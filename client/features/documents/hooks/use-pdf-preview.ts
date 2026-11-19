"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { generateDocument } from "../lib/generate-document";
import type { FieldValues } from "../lib/templates";

/** The PDF preview of a form: generates it, drops a stale one and ignores late answers. */
export function usePdfPreview(
  setNotice: (message: string | undefined) => void,
  /** The name the file is downloaded and kept under; the server's by default. */
  nameFile: (fileName: string) => string = (fileName) => fileName,
) {
  const [pdf, setPdf] = useState<{ url: string; fileName: string }>();
  const [generating, setGenerating] = useState(false);
  /** Only the newest request may show its result. */
  const latest = useRef(0);
  /** The latest naming rule, so `generate` keeps its identity when the project changes. */
  const naming = useRef(nameFile);
  useEffect(() => {
    naming.current = nameFile;
  }, [nameFile]);

  const clear = useCallback(() => {
    setPdf((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return undefined;
    });
  }, []);

  const discard = useCallback(() => {
    latest.current += 1;
    setGenerating(false);
    clear();
  }, [clear]);

  const generate = useCallback(
    async (templateId: string, values: FieldValues) => {
      latest.current += 1;
      const request = latest.current;
      clear();
      setGenerating(true);
      setNotice(undefined);
      try {
        const file = await generateDocument(templateId, "pdf", values);
        if (request !== latest.current) return;
        setPdf({
          url: URL.createObjectURL(file.blob),
          fileName: naming.current(file.fileName),
        });
      } catch (cause) {
        if (request === latest.current) setNotice(errorMessage(cause));
      } finally {
        if (request === latest.current) setGenerating(false);
      }
    },
    [clear, setNotice],
  );

  return { pdf, generating, generate, discard };
}
