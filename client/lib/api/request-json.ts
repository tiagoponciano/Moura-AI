/**
 * Browser `fetch` for our own API routes: resolves to the JSON body
 * (`undefined` for 204) and throws with the server's `error` field, so the
 * caller can show it, when the response is not 2xx.
 */
export async function requestJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(body?.error ?? `Request failed with ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

/** The message of a thrown value, for showing a caught error. */
export const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : String(cause);
