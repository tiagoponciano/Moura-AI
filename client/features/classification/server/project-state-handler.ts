import { z } from "zod";
import { parseJsonBody } from "@/lib/api/parse-json-body";
import { requireUser } from "@/lib/auth/require-user";
import { projectIdSchema } from "@/lib/projects/project";
import { pickState } from "../lib/classification-state";

type IdParams = { params: Promise<{ id: string }> };

const failure = (message: string, cause: unknown) => {
  console.error(message, cause);
  return Response.json({ error: message }, { status: 500 });
};

/** Body of `PUT /api/classification/projects/:id`; `state` is checked by `pickState`. */
const putBody = z.strictObject({ state: z.unknown() });

/** `GET /api/classification/projects/:id`: the saved classification of the project, `null` when none. */
export async function handleGetProjectState(
  _req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }

  const { data, error } = await session.supabase
    .from("project_classifications")
    .select("state, updated_at")
    .eq("project_id", id.data)
    .maybeSingle();
  if (error) return failure("Failed to load the classification", error);
  return Response.json({
    state: data ? pickState(data.state) : null,
    updated_at: data?.updated_at ?? null,
  });
}

/** `PUT /api/classification/projects/:id` with `{ state }`: replaces the saved classification inputs. */
export async function handlePutProjectState(
  req: Request,
  { params }: IdParams,
): Promise<Response> {
  const session = await requireUser("Projects are not configured");
  if (session.error) return session.error;

  const id = projectIdSchema.safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "Invalid project id" }, { status: 400 });
  }
  const body = await parseJsonBody(req, putBody);
  if (body.error) return body.error;

  const { error } = await session.supabase
    .from("project_classifications")
    .upsert({
      project_id: id.data,
      state: JSON.parse(JSON.stringify(pickState(body.data.state))),
    });
  if (error) return failure("Failed to save the classification", error);
  return new Response(null, { status: 204 });
}
