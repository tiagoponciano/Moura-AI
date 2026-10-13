import type { ZodType } from "zod";

/** Largest JSON body a route accepts. Chat bodies carry the whole conversation, so this is their ceiling too. */
export const MAX_JSON_BODY_BYTES = 1024 * 1024;

const tooLarge = () =>
  Response.json({ error: "Request body is too large" }, { status: 413 });

/**
 * Parses the JSON body with `schema`; a 413 response when it is larger than
 * `MAX_JSON_BODY_BYTES`, a 400 with the first issue when it does not fit.
 */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { error: Response }> {
  const declaredLength = Number(req.headers.get("content-length"));
  if (declaredLength > MAX_JSON_BODY_BYTES) return { error: tooLarge() };

  const bytes = await req.arrayBuffer().catch(() => undefined);
  if (bytes && bytes.byteLength > MAX_JSON_BODY_BYTES) {
    return { error: tooLarge() };
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    body = undefined;
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: Response.json(
        { error: result.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 },
      ),
    };
  }
  return { data: result.data };
}
