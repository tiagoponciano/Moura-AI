const CHAT_DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** `13/10/2026, 14:05` for an ISO timestamp. */
export function formatChatDate(iso: string): string {
  return CHAT_DATE_FORMAT.format(new Date(iso));
}
