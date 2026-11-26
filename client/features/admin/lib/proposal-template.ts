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
  missing?: string[];
  unknown?: string[];
}): string | undefined {
  const parts = [
    body.missing?.length &&
      `Faltam no modelo: ${body.missing.map((tag) => `{{${tag}}}`).join(", ")}.`,
    body.unknown?.length &&
      `O app não conhece: ${body.unknown.map((tag) => `{{${tag}}}`).join(", ")}.`,
  ].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}
