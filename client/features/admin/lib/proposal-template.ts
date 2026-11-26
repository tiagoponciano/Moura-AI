import { formatDateTime } from "@/lib/format";
import type { ProposalTemplateInfo } from "./types";

/** The one-line state on the section tab. */
export function templateSummary(info: ProposalTemplateInfo | undefined) {
  if (!info) return "Carregando…";
  return info.custom ? info.custom.fileName : "Modelo padrão do app";
}

/** Where the deck in use comes from, for the panel. */
export function templateSource(info: ProposalTemplateInfo): string {
  return info.custom
    ? `Enviado em ${formatDateTime(info.custom.uploadedAt)}`
    : "Nenhum modelo enviado: vale o que vem com o app.";
}

/** What the server found wrong with an uploaded deck, as one message; `undefined` when it listed nothing. */
export function tagProblems(body: {
  unknown?: string[];
  missing?: string[];
}): string | undefined {
  const list = (tags: string[]) => tags.map((tag) => `{{${tag}}}`).join(", ");
  const parts = [
    body.missing?.length && `Faltam no modelo: ${list(body.missing)}.`,
    body.unknown?.length && `O app não conhece: ${list(body.unknown)}.`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

/** The largest deck the console sends; the server and the bucket refuse more. */
export const MAX_TEMPLATE_BYTES = 20 * 1024 * 1024;

/** Why a dropped file cannot be the template, before anything is sent; `undefined` when it can. */
export function templateFileProblem(file: {
  name: string;
  size: number;
}): string | undefined {
  if (!/\.pptx$/i.test(file.name)) {
    return "O modelo precisa ser uma apresentação .pptx.";
  }
  if (file.size > MAX_TEMPLATE_BYTES) return "O arquivo passa de 20 MB.";
  return undefined;
}
