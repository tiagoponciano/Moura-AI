/** The analysis date, YYYY-MM-DD, in the firm's time zone. */
export function analysisDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);
}
