/**
 * The text to show for a failed chat request. The AI SDK puts the raw response
 * body in `error.message`; for our JSON errors that is `{"error":"..."}`, so
 * the `error` field is shown instead. Anything else is shown as-is.
 */
export function chatErrorMessage(error: Error): string {
  try {
    const body: unknown = JSON.parse(error.message);
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Not JSON: a provider or network message.
  }
  return error.message;
}
