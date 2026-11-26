/** Names of the tools whose results say which norms the assistant read. */
const SEARCH_TOOL = "search_norm";
const READ_TOOL = "read_norm_text";

/** One norm passage the assistant looked at, for the person to check against the norm. */
export type ConsultedNorm = {
  key: string;
  /** The instruction, like `IN 9`. */
  doc: string;
  /** Absent for an annex page. */
  article?: number;
  page: number;
  excerpt: string;
  /** Set when the person marked it as matching. */
  confirmed: boolean;
};

/** The most passages kept, the oldest unconfirmed one leaving first. */
const MAX_KEPT = 12;
const EXCERPT_LENGTH = 320;

const keyOf = (doc: string, article: number | undefined, page: number) =>
  article === undefined ? `${doc}#p${page}` : `${doc}#a${article}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** The passages in one tool result; nothing for another tool or an output of another shape. */
function passagesOf(
  toolName: string,
  output: unknown,
): Omit<ConsultedNorm, "confirmed">[] {
  if (!isRecord(output)) return [];
  const rows =
    toolName === SEARCH_TOOL && Array.isArray(output.hits)
      ? output.hits
      : toolName === READ_TOOL
        ? [output]
        : [];
  return rows.flatMap((row) => {
    if (!isRecord(row) || typeof row.doc !== "string") return [];
    if (typeof row.page !== "number") return [];
    const article = typeof row.article === "number" ? row.article : undefined;
    const text =
      typeof row.excerpt === "string"
        ? row.excerpt
        : typeof row.text === "string"
          ? row.text
          : "";
    if (!text.trim()) return [];
    return [
      {
        key: keyOf(row.doc, article, row.page),
        doc: row.doc,
        article,
        page: row.page,
        excerpt: text.replace(/\s+/g, " ").trim().slice(0, EXCERPT_LENGTH),
      },
    ];
  });
}

/**
 * The list after a tool result: new passages are added, one already listed keeps its
 * state (a longer reading replaces the excerpt), and the list stays within its limit.
 */
export function addConsulted(
  list: ConsultedNorm[],
  toolName: string,
  output: unknown,
): ConsultedNorm[] {
  let next = list;
  for (const passage of passagesOf(toolName, output)) {
    const known = next.find((item) => item.key === passage.key);
    next = known
      ? next.map((item) =>
          item.key === passage.key && toolName === READ_TOOL
            ? { ...item, excerpt: passage.excerpt }
            : item,
        )
      : [...next, { ...passage, confirmed: false }];
  }
  while (next.length > MAX_KEPT) {
    const drop = next.findIndex((item) => !item.confirmed);
    next = next.filter((_, index) => index !== (drop === -1 ? 0 : drop));
  }
  return next;
}

/** How a passage is named to the person and to the assistant: `IN 9, art. 12` or `IN 1, anexo, p. 4`. */
export function normLabel(norm: ConsultedNorm): string {
  return norm.article === undefined
    ? `${norm.doc}, anexo, p. ${norm.page}`
    : `${norm.doc}, art. ${norm.article}`;
}

/** What is sent to the assistant when a passage does not match the norm. */
export function recheckMessage(norm: ConsultedNorm): string {
  return `O trecho ${normLabel(norm)} não confere com a norma. Busque de novo, com outras palavras, e confira antes de responder.`;
}
