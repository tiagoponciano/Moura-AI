"use client";

import { useState } from "react";
import { errorMessage } from "@/lib/api/request-json";
import type { Project } from "@/lib/projects/project";
import { approvePdf } from "../lib/approve-pdf";

export type PdfApproval = {
  busy: boolean;
  error?: string;
  /** Downloads the previewed PDF and keeps it in the project; resolves to whether it went through. */
  approve: (pdf: { url: string; fileName: string }) => Promise<boolean>;
};

/** The approval that ends the review, with its progress and the message to show. */
export function usePdfApproval(project: Project | undefined): PdfApproval {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function approve(pdf: { url: string; fileName: string }) {
    setBusy(true);
    setError(undefined);
    try {
      const { warning } = await approvePdf(pdf, project?.id);
      setError(warning);
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, approve };
}
