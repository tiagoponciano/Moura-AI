import {
  answerKey,
  answersByItem,
  type Answer,
  type ChecklistGroup,
} from "./ppci-answers";

export type PendingGroup = {
  name: string;
  items: { text: string; section: string | null; note: string | null }[];
};

/** The items answered "Adequar", by group; groups with none are left out. */
export function pendingGroups(
  groups: ChecklistGroup[],
  answers: Answer[],
): PendingGroup[] {
  const byItem = answersByItem(answers);
  return groups.flatMap((group) => {
    const items = group.items.flatMap((item) => {
      const answer = byItem.get(answerKey(group.position, item.position));
      return answer?.status === "adequar"
        ? [{ text: item.text, section: item.section, note: answer.note }]
        : [];
    });
    return items.length > 0 ? [{ name: group.name, items }] : [];
  });
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type ReportHeader = {
  projectName: string;
  technicalName?: string;
  technicalRegistry?: string;
  /** Already formatted, shown as is. */
  date: string;
};

/** The HTML page of the pending-items report (print layout, A4). */
export function reportHtml(
  header: ReportHeader,
  groups: PendingGroup[],
): string {
  const technical = [header.technicalName, header.technicalRegistry]
    .filter(Boolean)
    .map((text) => escapeHtml(text as string))
    .join(" · ");
  const body =
    groups.length === 0
      ? "<p>Nenhum item a adequar.</p>"
      : groups
          .map(
            (group) => `<section>
<h2>${escapeHtml(group.name)}</h2>
<ol>
${group.items
  .map(
    (item) =>
      `<li>${item.section ? `<span class="section">${escapeHtml(item.section)}</span> ` : ""}${escapeHtml(item.text)}${item.note ? `<p class="note">${escapeHtml(item.note)}</p>` : ""}</li>`,
  )
  .join("\n")}
</ol>
</section>`,
          )
          .join("\n");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Pendências do PPCI</title>
<style>
body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; margin: 0; }
h1 { font-size: 16pt; margin: 0 0 4px; }
h2 { font-size: 12pt; border-bottom: 1px solid #999; padding-bottom: 2px; margin: 18px 0 6px; }
.meta { color: #444; margin-bottom: 12px; }
li { margin-bottom: 6px; }
.section { font-weight: bold; }
.note { margin: 2px 0 0; color: #444; font-style: italic; }
section { break-inside: avoid-page; }
</style>
</head>
<body>
<h1>Pendências do PPCI</h1>
<div class="meta">
<div>Projeto: ${escapeHtml(header.projectName)}</div>
${technical ? `<div>Responsável técnico: ${technical}</div>` : ""}
<div>Data: ${escapeHtml(header.date)}</div>
</div>
${body}
</body>
</html>`;
}
