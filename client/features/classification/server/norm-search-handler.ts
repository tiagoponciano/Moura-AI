import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { searchNorm } from "./search-norm";

const query = z.object({
  q: z.string().trim().min(3).max(200),
  doc: z.string().trim().max(20).optional(),
});

/**
 * `GET /api/classification/norm?q=<words>&doc=<IN 7>`: the articles of the
 * instructions that best match the words, each with its instruction, article,
 * page and an excerpt. `doc` limits the search to one instruction.
 */
export async function handleSearchNormText(req: Request): Promise<Response> {
  const session = await requireUser("Norm search is not configured");
  if (session.error) return session.error;

  const { searchParams } = new URL(req.url);
  const parsed = query.safeParse({
    q: searchParams.get("q") ?? "",
    doc: searchParams.get("doc") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "Informe ao menos 3 letras para buscar." },
      { status: 400 },
    );
  }
  return Response.json(await searchNorm(parsed.data.q, parsed.data.doc, 8));
}
