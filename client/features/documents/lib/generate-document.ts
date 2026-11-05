import { titleFromContentDisposition } from "@/lib/cbmsc-forms/title";
import type { DocumentFormat } from "./generate-request";
import type { FieldValues } from "./templates";

export type GeneratedFile = { blob: Blob; fileName: string };

/** Asks the server for the document; throws with the server's message on failure. */
export async function generateDocument(
  templateId: string,
  format: DocumentFormat,
  values: FieldValues,
): Promise<GeneratedFile> {
  const response = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId, format, values }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(body?.error ?? "Não foi possível gerar o documento.");
  }
  return {
    blob: await response.blob(),
    fileName:
      titleFromContentDisposition(
        response.headers.get("content-disposition"),
      ) ?? `${templateId}.${format}`,
  };
}
