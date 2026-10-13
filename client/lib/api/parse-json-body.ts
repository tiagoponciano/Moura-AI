import type { ZodType } from "zod";

/** Parses the JSON body with `schema`; a 400 response with the first issue when it does not fit. */
export async function parseJsonBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { error: Response }> {
  const body: unknown = await req.json().catch(() => undefined);
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
