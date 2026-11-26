"use client";

import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import { nameWithProject } from "@/lib/projects/file-name";
import { keepProjectFile } from "@/lib/projects/files-client";
import type { Project } from "@/lib/projects/project";
import { DEFAULT_VALIDITY_DAYS, type ProposalRequest } from "../lib/proposal";
import { requestProposal } from "../lib/proposal-client";

type Format = ProposalRequest["format"];

/** The proposal of a project: downloads in each format, and a PDF preview that a download can reuse. */
export function useProposal(
  project: Project,
  choice: { planId: string; reais: number; validity: string },
) {
  const [busy, setBusy] = useState<Format>();
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const [preview, setPreview] = useState<{ blob: Blob; url: string }>();

  // The preview's object URL lives as long as the preview.
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );

  async function keep(blob: Blob, format: Format) {
    const fileName = nameWithProject(`Proposta.${format}`, project.name);
    saveAs(blob, fileName);
    const kept = await keepProjectFile(project.id, blob, {
      kind: "proposal",
      fileName,
    });
    if (!kept) setNote("Baixada, mas não foi guardada no projeto.");
  }

  /** One request: the file is downloaded or, for the preview, opened. The PDF already previewed is not made again. */
  async function run(format: Format, action: "download" | "preview") {
    setBusy(format);
    setError(undefined);
    setNote(undefined);
    try {
      const blob =
        action === "download" && format === "pdf" && preview
          ? preview.blob
          : await requestProposal(project.id, {
              planId: choice.planId,
              price: choice.reais,
              validityDays: Number(choice.validity) || DEFAULT_VALIDITY_DAYS,
              format,
            });
      if (action === "preview") {
        setPreview({ blob, url: URL.createObjectURL(blob) });
      } else {
        await keep(blob, format);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(undefined);
    }
  }

  return {
    busy,
    error,
    note,
    preview,
    run,
    closePreview: () => setPreview(undefined),
  };
}
